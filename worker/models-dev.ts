import { UpstreamFailureError } from '@atcute/xrpc-server';

import * as v from 'valibot';

const CATALOG_URL = 'https://models.dev/api.json';

/** keep the raw catalog cache shorter-lived than the normalized cache. */
const CATALOG_TTL_SECONDS = 60;

const CATALOG_TIMEOUT_MS = 10_000;

const routeOverrideSchema = v.object({
	api: v.optional(v.string()),
	npm: v.optional(v.string()),
	shape: v.optional(v.string()),
});

const modelSchema = v.object({
	id: v.string(),
	modalities: v.optional(
		v.object({
			input: v.array(v.string()),
			output: v.array(v.string()),
		}),
	),
	name: v.string(),
	provider: v.optional(routeOverrideSchema),
	status: v.optional(v.string()),
	structured_output: v.optional(v.boolean()),
	temperature: v.optional(v.boolean()),
});

const providerSchema = v.object({
	api: v.optional(v.string()),
	id: v.string(),
	models: v.record(v.string(), modelSchema),
	name: v.string(),
	npm: v.optional(v.string()),
});

const catalogSchema = v.record(v.string(), providerSchema);

export type ModelsDevModel = v.InferOutput<typeof modelSchema>;
export type ModelsDevProvider = v.InferOutput<typeof providerSchema>;

/**
 * fetches and validates the models.dev catalog.
 *
 * @returns providers in catalog order
 * @throws {UpstreamFailureError} when the catalog is unavailable or invalid
 */
export const loadModelsDevCatalog = async (): Promise<ModelsDevProvider[]> => {
	let catalog: ModelsDevProvider[];
	try {
		const response = await fetch(CATALOG_URL, {
			cf: { cacheEverything: true, cacheTtl: CATALOG_TTL_SECONDS },
			signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
		});
		if (!response.ok) {
			await response.body?.cancel().catch(() => {});
			throw new Error(`models.dev returned ${response.status}`);
		}

		catalog = Object.values(v.parse(catalogSchema, await response.json()));
	} catch (error: unknown) {
		return unavailable(error);
	}

	if (catalog.length === 0) {
		return unavailable(new Error('models.dev returned no providers'));
	}
	return catalog;
};

const unavailable = (cause: unknown): never => {
	// do not expose upstream errors to clients.
	console.error('models.dev catalog unavailable:', cause);

	throw new UpstreamFailureError({
		error: 'CatalogUnavailable',
		message: 'the model catalog could not be reached',
	});
};
