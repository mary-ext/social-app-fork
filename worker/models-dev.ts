import * as v from 'valibot';

const CATALOG_URL = 'https://models.dev/api.json';

const HEADERS_TIMEOUT_MS = 2_000;

// allow longer for the multi-megabyte body than for response headers.
const BODY_TIMEOUT_MS = 10_000;

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
	tool_call: v.optional(v.boolean()),
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

export type ModelsDevCatalog = {
	/** upstream ETag, if provided; pass to {@link revalidateModelsDevCatalog}. */
	etag: string | undefined;
	/** providers in catalog order. */
	providers: ModelsDevProvider[];
};

/**
 * fetches and validates the models.dev catalog.
 *
 * @returns the catalog and its validator
 * @throws {Error} when the catalog is unreachable or invalid
 */
export const loadModelsDevCatalog = async (): Promise<ModelsDevCatalog> => {
	const fetched = await requestCatalog(undefined);
	if (fetched === undefined) {
		throw new Error('models.dev reported no change for an unconditional request');
	}

	return fetched;
};

/**
 * fetches and validates the models.dev catalog if its ETag has changed.
 *
 * @param etag previously received ETag
 * @returns the updated catalog, or `undefined` if unchanged
 * @throws {Error} when the catalog is unreachable or invalid
 */
export const revalidateModelsDevCatalog = (etag: string): Promise<ModelsDevCatalog | undefined> => {
	return requestCatalog(etag);
};

const requestCatalog = async (etag: string | undefined): Promise<ModelsDevCatalog | undefined> => {
	const controller = new AbortController();

	let response: Response;
	{
		const expire = setTimeout(() => controller.abort(), HEADERS_TIMEOUT_MS);
		try {
			response = await fetch(CATALOG_URL, {
				headers: etag !== undefined ? { 'if-none-match': etag } : undefined,
				signal: controller.signal,
			});
		} finally {
			clearTimeout(expire);
		}
	}

	if (response.status === 304) {
		await response.body?.cancel().catch(() => {});
		return undefined;
	}

	if (!response.ok) {
		await response.body?.cancel().catch(() => {});
		throw new Error(`models.dev returned ${response.status}`);
	}

	let source: unknown;
	{
		const expire = setTimeout(() => controller.abort(), BODY_TIMEOUT_MS);
		try {
			source = await response.json();
		} finally {
			clearTimeout(expire);
		}
	}

	const providers = Object.values(v.parse(catalogSchema, source));
	if (providers.length === 0) {
		throw new Error('models.dev returned no providers');
	}

	return { etag: response.headers.get('etag') ?? undefined, providers };
};
