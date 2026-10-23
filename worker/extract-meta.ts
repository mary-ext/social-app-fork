import type { CanonicalResourceUri } from '@atcute/lexicons';
import { isCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { decodeHtmlEntities } from './html-entities';

export interface LinkMetaResult {
	/** record URI, preferring standard.site document, then publication. */
	canonicalUri?: CanonicalResourceUri;
	description?: string;
	image?: string;
	/** oEmbed endpoint advertised by the page. */
	oembedUrl?: string;
	title?: string;
}

/** OpenGraph and Twitter meta keys to extract. */
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

/** JSON oEmbed discovery type. */
const OEMBED_LINK_TYPE = 'application/json+oembed';

/** folds case and whitespace so two tags that render identically compare equal. */
const flatten = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * extracts link-card metadata, a canonical record URI, and an oEmbed endpoint from HTML.
 *
 * @param html the document bytes (typically truncated to the `<head>` region)
 * @returns metadata with OpenGraph preferred over Twitter tags and `<title>`
 */
export const parseHtmlMeta = async (html: Uint8Array): Promise<LinkMetaResult> => {
	const meta: Record<string, string> = {};
	let documentUri: CanonicalResourceUri | undefined;
	let publicationUri: CanonicalResourceUri | undefined;
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
				// rel may contain several space-separated tokens.
				const tokens = rel.toLowerCase().split(/\s+/);

				if (
					oembedUrl === undefined &&
					tokens.includes('alternate') &&
					element.getAttribute('type')?.trim().toLowerCase() === OEMBED_LINK_TYPE
				) {
					// decode query parameters before storing the endpoint.
					oembedUrl = decodeHtmlEntities(href);
					return;
				}

				if (!isCanonicalResourceUri(href)) {
					return;
				}
				if (documentUri === undefined && tokens.includes('site.standard.document')) {
					documentUri = href;
				}
				if (publicationUri === undefined && tokens.includes('site.standard.publication')) {
					publicationUri = href;
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

	// consume the body to run the handlers above.
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

	// skip descriptions that only repeat the title so the next metadata key can provide the summary.
	const flattened = title && flatten(title);
	let description = pick(
		['og:description', 'twitter:description', 'description'],
		(value) => flatten(value) === flattened,
	);

	if (title && description) {
		// strip a separator-delimited title prefix without clipping real text.
		const rest = description.slice(title.length);
		if (description.toLowerCase().startsWith(title.toLowerCase()) && /^[\s\p{P}]/u.test(rest)) {
			const stripped = rest.replace(/^[\s\p{P}]+/u, '');
			if (stripped) {
				description = stripped;
			}
		}
	}

	return {
		// the appview discovers a document's publication from the document itself.
		canonicalUri: documentUri ?? publicationUri,
		description,
		image: pick(['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']),
		oembedUrl,
		title,
	};
};
