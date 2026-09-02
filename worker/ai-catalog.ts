import { waitUntil } from 'cloudflare:workers';

import type * as v from '@atcute/lexicons/validations';

import {
	AI_MODALITIES,
	type AiEndpoint,
	type AiModality,
	type AiModelOffer,
	type AiProvider,
	type AiWireFormat,
	type listAiModels,
} from '../src/lib/lexicons';
import { selectCorsAllowedUrls } from './ai-cors';
import { type AiProviderOverlay, PROVIDER_OVERLAYS } from './ai-overlay';
import { loadModelsDevCatalog, type ModelsDevModel, type ModelsDevProvider } from './models-dev';

const SUPPORTED_FORMATS = new Set<AiWireFormat>(['openai_chat_completions']);

/** maps AI SDK packages to their wire format. */
const PACKAGE_FORMATS: Record<string, AiWireFormat> = {
	'@ai-sdk/anthropic': 'anthropic_messages',
	'@ai-sdk/google-vertex/anthropic': 'anthropic_messages',
	'@ai-sdk/openai': 'openai_responses',
	'@ai-sdk/openai-compatible': 'openai_chat_completions',
	'@openrouter/ai-sdk-provider': 'openai_chat_completions',
	'merge-gateway-ai-sdk-provider': 'openai_chat_completions',
};

const FORMAT_PATHS: Record<AiWireFormat, string> = {
	anthropic_messages: '/messages',
	openai_chat_completions: '/chat/completions',
	openai_responses: '/responses',
};

const BEARER_AUTH: AiEndpoint['auth'] = { header: 'authorization', prefix: 'Bearer ' };

const KNOWN_MODALITIES = new Set<string>(AI_MODALITIES);

type NormalizedProvider = { offers: AiModelOffer[]; provider: AiProvider };

const CATALOG_CACHE_TTL = 15 * 60;
const CATALOG_CACHE_KEY = 'https://ai-catalog.invalid/1';

/**
 * lists providers with at least one supported model.
 *
 * @returns providers and their endpoints
 * @throws {UpstreamFailureError} when the catalog is unavailable
 */
export const listAiProviderCatalog = async (): Promise<{ providers: AiProvider[] }> => {
	const listed = await loadNormalizedCatalog();
	return { providers: listed.map((entry) => entry.provider) };
};

type ModelParams = v.InferOutput<(typeof listAiModels)['params']>;

/**
 * lists model routes matching the requested capabilities.
 *
 * @param params provider and capability filters
 * @returns matching offers in stable order
 * @throws {UpstreamFailureError} when the catalog is unavailable
 */
export const listAiModelOffers = async (params: ModelParams): Promise<{ models: AiModelOffer[] }> => {
	const listed = await loadNormalizedCatalog();

	const requested = new Set(params.providers);
	const formats = new Set<AiWireFormat>(params.formats);
	const models: AiModelOffer[] = [];

	for (const { offers, provider } of listed) {
		if (!requested.has(provider.id)) {
			continue;
		}

		for (const offer of offers) {
			if (!formats.has(offer.format)) {
				continue;
			}
			if (offer.deprecated && !params.includeDeprecated) {
				continue;
			}
			if (params.structuredOutput && !offer.capabilities.structuredOutput) {
				continue;
			}
			if (
				covers(offer.capabilities.inputModalities, params.inputModalities) &&
				covers(offer.capabilities.outputModalities, params.outputModalities)
			) {
				models.push(offer);
			}
		}
	}

	return { models };
};

const covers = (available: readonly AiModality[], required: readonly AiModality[]): boolean => {
	return required.every((modality) => available.includes(modality));
};

const loadNormalizedCatalog = async (): Promise<NormalizedProvider[]> => {
	const cached = await caches.default.match(CATALOG_CACHE_KEY);
	if (cached) {
		return await cached.json<NormalizedProvider[]>();
	}

	const listed = await dropCorsBlocked(normalizeCatalog(await loadModelsDevCatalog()));
	waitUntil(
		caches.default.put(
			CATALOG_CACHE_KEY,
			Response.json(listed, {
				headers: { 'cache-control': `public, max-age=${CATALOG_CACHE_TTL}` },
			}),
		),
	);

	return listed;
};

const dropCorsBlocked = async (listed: NormalizedProvider[]): Promise<NormalizedProvider[]> => {
	const allowed = await selectCorsAllowedUrls(
		listed.flatMap(({ provider }) => provider.endpoints.map((endpoint) => endpoint.url)),
	);

	const kept: NormalizedProvider[] = [];
	for (const entry of listed) {
		const endpoints = entry.provider.endpoints.filter((endpoint) => allowed.has(endpoint.url));
		const ids = new Set(endpoints.map((endpoint) => endpoint.id));
		const offers = entry.offers.filter((offer) => ids.has(offer.endpoint));

		if (isAdvertisable(offers)) {
			kept.push({ offers, provider: { ...entry.provider, endpoints } });
		}
	}
	return kept;
};

const normalizeCatalog = (source: ModelsDevProvider[]): NormalizedProvider[] => {
	const listed: NormalizedProvider[] = [];
	for (const entry of source) {
		const normalized = normalizeProvider(entry);
		if (normalized) {
			listed.push(normalized);
		}
	}

	listed.sort((a, b) => {
		return compare(a.provider.name, b.provider.name) || compare(a.provider.id, b.provider.id);
	});
	return listed;
};

const compare = (a: string, b: string): number => {
	return a < b ? -1 : a > b ? 1 : 0;
};

const isAdvertisable = (offers: readonly AiModelOffer[]): boolean => {
	return offers.some((offer) => !offer.deprecated);
};

const normalizeProvider = (source: ModelsDevProvider): NormalizedProvider | undefined => {
	const overlay = PROVIDER_OVERLAYS[source.id];

	// overlays correct unusable or missing catalog URLs.
	const providerBase = normalizeBase(overlay?.api) ?? normalizeBase(source.api);

	const endpoints = new Map<string, AiEndpoint>();
	const offers: AiModelOffer[] = [];

	for (const model of Object.values(source.models)) {
		const format = resolveFormat(model, overlay, source);
		if (format === undefined || !SUPPORTED_FORMATS.has(format)) {
			continue;
		}

		// an invalid model-specific URL must not fall back to the provider URL.
		const route = model.provider;
		const base = route?.api !== undefined ? normalizeBase(route.api) : providerBase;
		if (base === undefined) {
			continue;
		}

		// extra routes require stable ids for saved selections.
		const id = base === providerBase ? format : overlay?.endpointIds?.[base];
		if (id === undefined) {
			continue;
		}

		const url = base + FORMAT_PATHS[format];
		const existing = endpoints.get(id);
		if (existing === undefined) {
			endpoints.set(id, { auth: BEARER_AUTH, format, id, tokenLimitField: overlay?.tokenLimitField, url });
		} else if (existing.format !== format || existing.url !== url) {
			// reject ambiguous endpoint ids.
			continue;
		}

		offers.push({
			capabilities: {
				inputModalities: toModalities(model.modalities?.input),
				outputModalities: toModalities(model.modalities?.output),
				structuredOutput: model.structured_output === true,
				// omit temperature unless explicitly supported.
				temperature: model.temperature === true,
			},
			deprecated: model.status === 'deprecated' || undefined,
			endpoint: id,
			format,
			model: model.id,
			name: model.name,
			provider: source.id,
		});
	}

	// keep deprecated offers resolvable, but hide deprecated-only providers.
	if (!isAdvertisable(offers)) {
		return undefined;
	}

	offers.sort((a, b) => compare(a.name, b.name) || compare(a.model, b.model));

	return {
		offers,
		provider: {
			endpoints: [...endpoints.values()].toSorted((a, b) => compare(a.id, b.id)),
			id: source.id,
			name: source.name,
		},
	};
};

/** resolves format by shape, model package, overlay, then provider package. */
const resolveFormat = (
	model: ModelsDevModel,
	overlay: AiProviderOverlay | undefined,
	source: ModelsDevProvider,
): AiWireFormat | undefined => {
	const route = model.provider;

	switch (route?.shape) {
		case 'completions': {
			return 'openai_chat_completions';
		}
		case 'responses': {
			return 'openai_responses';
		}
	}

	if (route?.npm !== undefined) {
		return PACKAGE_FORMATS[route.npm];
	}
	return overlay?.format ?? (source.npm !== undefined ? PACKAGE_FORMATS[source.npm] : undefined);
};

const normalizeBase = (raw: string | undefined): string | undefined => {
	// deployment templates cannot be resolved in the browser.
	if (raw === undefined || raw.includes('${')) {
		return undefined;
	}

	const url = URL.parse(raw);
	if (url === null || url.protocol !== 'https:' || url.search !== '' || url.hash !== '') {
		return undefined;
	}
	return url.href.replace(/\/+$/, '');
};

const toModalities = (values: string[] | undefined): AiModality[] => {
	return values?.filter((value): value is AiModality => KNOWN_MODALITIES.has(value)) ?? [];
};
