import type { ResourceUri } from '@atcute/lexicons';
import { isResourceUri } from '@atcute/lexicons/syntax';

import { decodeHtmlEntities } from './html-entities';

export interface LinkMetaResult {
	/** AT-URIs of the standard.site Atmosphere records the page advertises via `<link rel>` discovery tags. */
	associatedUris?: ResourceUri[];
	description?: string;
	image?: string;
	/** the oEmbed endpoint the page advertises via its `<link rel="alternate">` discovery tag. */
	oembedUrl?: string;
	title?: string;
}

/** OpenGraph/Twitter meta keys we extract, lowercased. */
const WANTED_META = new Set([
	'description',
	'og:description',
	'og:image',
	'og:image:secure_url',
	'og:image:url',
	'og:title',
	'twitter:description',
	'twitter:image',
	'twitter:image:src',
	'twitter:title',
]);

/** `<link rel>` values pointing at the standard.site records that back a page. */
const STANDARD_SITE_RELS = new Set(['site.standard.document', 'site.standard.publication']);

/** the `type` an oEmbed discovery tag carries; the spec also defines an XML variant we don't consume. */
const OEMBED_LINK_TYPE = 'application/json+oembed';

/** folds case and whitespace so two tags that render identically compare equal. */
const flatten = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * streams an HTML document through {@link HTMLRewriter} and pulls out the title, description, and a thumbnail
 * URL from its OpenGraph/Twitter meta tags and `<title>`.
 *
 * @param html the document bytes (typically truncated to the `<head>` region)
 * @returns the first matching value found for each field
 */
export const parseHtmlMeta = async (html: Uint8Array): Promise<LinkMetaResult> => {
	const meta: Record<string, string> = {};
	const associatedUris: ResourceUri[] = [];
	let oembedUrl: string | undefined;
	let titleText = '';

	const rewriter = new HTMLRewriter()
		.on('head title', {
			text(chunk) {
				titleText += chunk.text;
			},
		})
		.on('head link', {
			element(element) {
				const rel = element.getAttribute('rel');
				const href = element.getAttribute('href');
				if (!rel || !href) {
					return;
				}
				// rel may carry several space-separated tokens, e.g. `site.standard.document external`.
				const tokens = rel.toLowerCase().split(/\s+/);

				if (
					oembedUrl === undefined &&
					tokens.includes('alternate') &&
					element.getAttribute('type')?.trim().toLowerCase() === OEMBED_LINK_TYPE
				) {
					// unlike the AT-URIs below, this href carries a query string, so its `&` arrives encoded.
					oembedUrl = decodeHtmlEntities(href);
					return;
				}

				// a malformed AT-URI would only make the appview reject the whole hydration batch, so drop it here
				if (!isResourceUri(href) || associatedUris.includes(href)) {
					return;
				}
				if (tokens.some((token) => STANDARD_SITE_RELS.has(token))) {
					associatedUris.push(href);
				}
			},
		})
		.on('meta', {
			element(element) {
				const key = (element.getAttribute('property') ?? element.getAttribute('name'))?.toLowerCase();
				if (!key || !WANTED_META.has(key) || meta[key] !== undefined) {
					return;
				}
				const content = element.getAttribute('content');
				if (content) {
					meta[key] = decodeHtmlEntities(content);
				}
			},
		});

	// draining the transformed body is what actually runs the handlers above.
	await rewriter.transform(new Response(html)).arrayBuffer();

	const pick = (keys: string[], reject?: (value: string) => boolean): string | undefined => {
		for (const key of keys) {
			const value = meta[key]?.trim();
			if (value && !reject?.(value)) {
				return value;
			}
		}
		return undefined;
	};

	const title = pick(['og:title', 'twitter:title']) ?? (decodeHtmlEntities(titleText).trim() || undefined);

	// a description that only restates the title renders the card's second line as an echo of its first. some
	// CMSes do exactly that, filling `og:description` with the headline while the real summary sits in
	// `<meta name="description">`, so a duplicate falls through to the next tag instead of ending the search.
	const flattened = title && flatten(title);
	let description = pick(
		['og:description', 'twitter:description', 'description'],
		(value) => flatten(value) === flattened,
	);

	if (title && description) {
		// some CMSes prepend the title verbatim to the description; strip the redundant prefix so the
		// card doesn't render the title twice. only act on a clean separator-delimited prefix that
		// leaves real text behind, to avoid clipping a description that merely opens with the same words.
		const rest = description.slice(title.length);
		if (description.toLowerCase().startsWith(title.toLowerCase()) && /^[\s\p{P}]/u.test(rest)) {
			const stripped = rest.replace(/^[\s\p{P}]+/u, '');
			if (stripped) {
				description = stripped;
			}
		}
	}

	return {
		associatedUris: associatedUris.length ? associatedUris : undefined,
		description,
		image: pick(['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']),
		oembedUrl,
		title,
	};
};
