// registers `app.bsky.embed.getEmbedExternalView` on the ambient XRPC interface so `.get()` is typed.
// oxlint-disable-next-line import/no-empty-named-blocks, unicorn/require-module-specifiers -- the empty specifier list is the point
import type {} from '@atcute/bluesky/types/app/embed/getEmbedExternalView';
import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { GenericUri, ResourceUri } from '@atcute/lexicons';

import { type LinkMetaResult, parseHtmlMeta } from './extract-meta';
import { assertHttpUrl, contentTypeOf, parseHttpUrl, readCapped, safeFetch } from './net';
import { resolveOEmbed } from './oembed';

/** cap on the HTML we buffer; meta tags live in `<head>`, near the top. */
const HTML_MAX_BYTES = 768 * 1024;
/** getEmbedExternalView resolves at most this many records; the rest of a page's discovery tags are ignored. */
const MAX_ASSOCIATED_URIS = 4;
/** public, unauthenticated Bluesky appview that hydrates standard.site embeds; mirrors `PUBLIC_BSKY_SERVICE`. */
const appview = new Client({ handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }) });
/** cap on thumbnail size we'll fetch and cache. */
const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
/** seconds a cached thumbnail stays warm; covers a compose session and a draft reopen. */
const IMAGE_CACHE_TTL = 60 * 60 * 6;
const IMAGE_ENDPOINT = '/xrpc/internal.app.getLinkImage';
const ALLOWED_IMAGE_TYPES = new Set(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']);
/** code-point caps so a hostile page can't push a huge title/description into a downstream embed record. */
const TITLE_MAX = 1000;
const DESCRIPTION_MAX = 2000;

/**
 * collapses horizontal whitespace, strips control characters, and truncates by code point. line breaks
 * survive (normalized to `\n`, blank-line runs collapsed to one) so multi-line descriptions stay faithful.
 */
const clean = (value: string | undefined, max: number): string | undefined => {
	if (!value) {
		return undefined;
	}
	const normalized = value
		.replace(/\r\n?/g, '\n')
		// strip control characters, but keep `\n` as a line separator.
		// oxlint-disable-next-line no-control-regex
		.replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ')
		// collapse horizontal whitespace, then blank-line runs (with surrounding spaces) to a single `\n`.
		.replace(/[^\S\n]+/g, ' ')
		.replace(/ ?\n[\n ]*/g, '\n')
		.trim();
	if (!normalized) {
		return undefined;
	}
	const points = Array.from(normalized);
	return points.length > max ? points.slice(0, max).join('') : normalized;
};

/** a title that is only a URL duplicates what the card already shows beneath it, so it is worth nothing. */
const isBareUrl = (value: string | undefined): boolean =>
	value !== undefined && parseHttpUrl(value) !== undefined;

interface StrongRef {
	cid: string;
	uri: string;
}

export interface LinkMetaResponse {
	/** strong refs of the standard.site records backing this link, as resolved by the appview. */
	associatedRefs?: StrongRef[];
	description?: string;
	image?: string;
	title?: string;
	url?: string;
	/** appview-hydrated enhanced card (`app.bsky.embed.external#view`) for a standard.site link. */
	view?: unknown;
}

interface ResolveLinkMetaOptions {
	/** the URL of the incoming request, used to derive the same-origin cache key for thumbnails. */
	requestUrl: string;
	signal: AbortSignal;
	url: string;
}

interface CacheThumbnailOptions {
	imageUrl: URL;
	requestUrl: string;
	signal: AbortSignal;
}

const toHex = (buffer: ArrayBuffer): string => {
	let out = '';
	for (const byte of new Uint8Array(buffer)) {
		out += byte.toString(16).padStart(2, '0');
	}
	return out;
};

const hashKey = async (input: string): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return toHex(digest);
};

/**
 * fetches a thumbnail, validates it, and stores the bytes in the edge cache keyed by the same-origin
 * {@link getLinkImage} URL that will later serve them. failures are swallowed — a missing thumbnail just
 * yields a plain link card.
 *
 * @returns the origin-relative path to the cached thumbnail, or undefined on any failure
 */
const cacheThumbnail = async ({
	imageUrl,
	requestUrl,
	signal,
}: CacheThumbnailOptions): Promise<string | undefined> => {
	try {
		const { response } = await safeFetch(imageUrl, { accept: 'image/*', signal, timeoutMs: 10_000 });

		const contentType = contentTypeOf(response);
		if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
			return undefined;
		}

		const bytes = await readCapped(response, { maxBytes: IMAGE_MAX_BYTES, truncate: false });
		const endpoint = `${IMAGE_ENDPOINT}?k=${await hashKey(imageUrl.href)}`;
		const cacheKey = new Request(new URL(endpoint, requestUrl), { method: 'GET' });
		const stored = new Response(bytes, {
			headers: {
				'cache-control': `public, max-age=${IMAGE_CACHE_TTL}`,
				'content-type': contentType,
				'x-content-type-options': 'nosniff',
			},
		});

		await caches.default.put(cacheKey, stored);
		return endpoint;
	} catch {
		return undefined;
	}
};

/**
 * hands the standard.site AT-URIs a page advertised to the appview's `getEmbedExternalView`, which resolves
 * them into strong refs (URI+CID) and a hydrated enhanced-card view. failures degrade to a plain link card.
 *
 * @param uris the AT-URIs discovered in the page's `<link rel>` tags
 * @param url the resolved web URL the embed represents, used as the view's `uri`
 * @returns the appview's refs and view, or an empty object when nothing resolved
 */
const hydrateStandardSite = async (
	uris: ResourceUri[],
	url: string,
	signal: AbortSignal,
): Promise<{ associatedRefs?: StrongRef[]; view?: unknown }> => {
	try {
		const data = await ok(
			appview.get('app.bsky.embed.getEmbedExternalView', {
				params: {
					uris: uris.slice(0, MAX_ASSOCIATED_URIS),
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `url` is a `URL.href`, which always carries a scheme
					url: url as GenericUri,
				},
				signal,
			}),
		);
		return { associatedRefs: data.associatedRefs, view: data.view };
	} catch {
		return {};
	}
};

/**
 * resolves metadata for an external URL. fetches the page and scrapes its OpenGraph/Twitter meta tags,
 * falling back to oEmbed when they yield nothing, and caches any thumbnail behind {@link getLinkImage}.
 *
 * @throws {InvalidRequestError} when the URL is malformed or uses an unsupported scheme
 * @throws {UpstreamFailureError | UpstreamTimeoutError} when the page can't be fetched
 */
export const resolveLinkMeta = async ({
	requestUrl,
	signal,
	url,
}: ResolveLinkMetaOptions): Promise<LinkMetaResponse> => {
	const target = assertHttpUrl(url);
	const {
		chain,
		response,
		url: resolvedUrl,
	} = await safeFetch(target, {
		accept: 'text/html,application/xhtml+xml',
		signal,
		timeoutMs: 8_000,
	});

	const contentType = contentTypeOf(response);
	const isDocument = !contentType || contentType.includes('html') || contentType.includes('xml');

	// a non-2xx body is an error page or a bot interstitial, so neither it nor its URL describes the link.
	let meta: LinkMetaResult | undefined;
	if (response.ok && isDocument) {
		meta = await parseHtmlMeta(await readCapped(response, { maxBytes: HTML_MAX_BYTES, truncate: true }));
	} else {
		await response.body?.cancel().catch(() => {});
	}

	let title = clean(meta?.title, TITLE_MAX);
	let description = clean(meta?.description, DESCRIPTION_MAX);
	let imageSource = meta?.image;
	let pageUrl = response.ok ? resolvedUrl : target;

	if (isBareUrl(title)) {
		title = undefined;
	}

	// a genuine non-document, a PDF or an image, has no endpoint to advertise or to guess at.
	if (!title && !imageSource && (!response.ok || isDocument)) {
		const discovered = meta?.oembedUrl ? parseHttpUrl(meta.oembedUrl, resolvedUrl) : undefined;
		const oembed = await resolveOEmbed({
			advertised: discovered && { endpoint: discovered, page: resolvedUrl },
			chain,
			signal,
		});
		if (oembed) {
			title = clean(oembed.meta.title, TITLE_MAX);
			description = clean(oembed.meta.description, DESCRIPTION_MAX);
			imageSource = oembed.meta.image;
			// report the hop the metadata describes, not wherever the chain happened to end up.
			pageUrl = oembed.page;
		}
	}

	let image: string | undefined;
	if (imageSource) {
		const imageUrl = parseHttpUrl(imageSource, pageUrl);
		if (imageUrl) {
			image = await cacheThumbnail({ imageUrl, requestUrl, signal });
		}
	}

	const standardSite = meta?.associatedUris?.length
		? await hydrateStandardSite(meta.associatedUris, resolvedUrl.href, signal)
		: undefined;

	return {
		associatedRefs: standardSite?.associatedRefs,
		description,
		image,
		title,
		url: pageUrl.href,
		view: standardSite?.view,
	};
};
