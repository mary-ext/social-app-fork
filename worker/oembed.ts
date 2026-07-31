import { contentTypeOf, readCapped, safeFetch } from './net';

/** oEmbed payloads are a handful of fields; anything larger isn't one. */
const OEMBED_MAX_BYTES = 64 * 1024;
/** the embed types the oEmbed spec defines. */
const OEMBED_TYPES = new Set(['link', 'photo', 'rich', 'video']);
/** ceiling on endpoints tried per link, so a long redirect chain can't turn one unfurl into a probe storm. */
const MAX_CANDIDATES = 3;

/** the parts of an oEmbed payload a link card can use. */
export interface OEmbedMeta {
	/** the author or channel name. oEmbed carries no description field, so this stands in for one. */
	description?: string;
	/** the provider's thumbnail, possibly relative to the page it describes. */
	image?: string;
	title?: string;
}

/** an endpoint worth asking, paired with the page whose metadata its answer would be. */
export interface OEmbedCandidate {
	endpoint: URL;
	page: URL;
}

const stringOf = (value: unknown): string | undefined =>
	typeof value === 'string' && value ? value : undefined;

/** the endpoint most providers expose: `/oembed` on the host that serves the content. */
const conventionalEndpoint = (page: URL): URL => {
	const endpoint = new URL('/oembed', page.origin);
	endpoint.searchParams.set('url', page.href);
	endpoint.searchParams.set('format', 'json');
	return endpoint;
};

/**
 * fetches an oEmbed endpoint and validates the response before using it.
 *
 * @returns the usable fields, or undefined when the endpoint is unreachable or serves something else
 */
const fetchOEmbed = async (endpoint: URL, signal: AbortSignal): Promise<OEmbedMeta | undefined> => {
	try {
		const { response } = await safeFetch(endpoint, {
			accept: 'application/json',
			// an endpoint answers directly; chasing redirects would multiply every probe by the redirect limit.
			maxRedirects: 0,
			signal,
			timeoutMs: 5_000,
		});
		if (!response.ok || !contentTypeOf(response).includes('json')) {
			await response.body?.cancel().catch(() => {});
			return undefined;
		}

		// `JSON.parse` is `any`, so this annotation costs no assertion; a non-object payload fails below.
		const payload: Record<string, unknown> = JSON.parse(
			new TextDecoder().decode(
				await readCapped(response, {
					maxBytes: OEMBED_MAX_BYTES,
					truncate: false,
				}),
			),
		);

		// the endpoint may be a guess, so the spec's required fields are what tell a real payload from the
		// JSON error body served at an unrelated path. `version` comes back as both string and number.
		const type = payload.type;
		if (!payload.version || typeof type !== 'string' || !OEMBED_TYPES.has(type)) {
			return undefined;
		}

		return {
			description: stringOf(payload.author_name),
			image: stringOf(payload.thumbnail_url),
			title: stringOf(payload.title),
		};
	} catch {
		return undefined;
	}
};

export interface ResolveOEmbedOptions {
	/** the endpoint the page advertised in its discovery tag, tried ahead of any guess. */
	advertised: OEmbedCandidate | undefined;
	/** the redirect chain the page fetch walked, in order. */
	chain: readonly URL[];
	signal: AbortSignal;
}

/**
 * finds oEmbed metadata for a page, trying the endpoint it advertised before guessing at the conventional
 * `/oembed` path on each distinct origin in its redirect chain. at most {@link MAX_CANDIDATES} are tried.
 *
 * @returns the metadata and the hop it describes, or undefined when nothing answered
 */
export const resolveOEmbed = async ({
	advertised,
	chain,
	signal,
}: ResolveOEmbedOptions): Promise<{ meta: OEmbedMeta; page: URL } | undefined> => {
	const candidates: OEmbedCandidate[] = advertised ? [advertised] : [];
	// walking the chain is what makes short links resolve: `youtu.be/x` redirects to `youtube.com/watch` and
	// on to a bot interstitial, and only that middle hop hosts an endpoint.
	const origins = new Set<string>();
	for (const hop of chain) {
		if (origins.has(hop.origin)) {
			continue;
		}
		origins.add(hop.origin);
		candidates.push({ endpoint: conventionalEndpoint(hop), page: hop });
	}

	for (const { endpoint, page } of candidates.slice(0, MAX_CANDIDATES)) {
		const meta = await fetchOEmbed(endpoint, signal);
		if (meta) {
			return { meta, page };
		}
	}
	return undefined;
};
