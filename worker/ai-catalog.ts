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

/**
 * lists providers with at least one supported model.
 *
 * @returns providers and their endpoints
 * @throws {UpstreamFailureError} when the catalog is unavailable
 */
export const listAiProviderCatalog = async (): Promise<{ providers: AiProvider[] }> => {
	const listed = await normalizeCatalog(() => true);
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
	const requested = new Set(params.providers);
	const listed = await normalizeCatalog((source) => requested.has(source.id));

	const formats = new Set<AiWireFormat>(params.formats);
	const models: AiModelOffer[] = [];

	for (const { offers } of listed) {
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

const normalizeCatalog = async (
	wanted: (source: ModelsDevProvider) => boolean,
): Promise<NormalizedProvider[]> => {
	const source = await loadModelsDevCatalog();

	const listed: NormalizedProvider[] = [];
	for (const entry of source) {
		if (!wanted(entry)) {
			continue;
		}

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

	// keep deprecated offers resolvable, but do not advertise deprecated-only providers.
	if (!offers.some((offer) => !offer.deprecated)) {
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
