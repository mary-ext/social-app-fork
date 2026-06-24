import { decodeHtmlEntities } from './html-entities';

export interface LinkMetaResult {
	/** at-uris of the standard.site atmosphere records the page advertises via `<link rel>` discovery tags. */
	associatedUris?: string[];
	description?: string;
	image?: string;
	title?: string;
}

/** opengraph/twitter meta keys we extract, lowercased. */
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

/**
 * streams an html document through {@link HTMLRewriter} and pulls out the title, description, and a thumbnail
 * url from its opengraph/twitter meta tags and `<title>`.
 *
 * @param html the document bytes (typically truncated to the `<head>` region)
 * @returns the first matching value found for each field
 */
export const parseHtmlMeta = async (html: Uint8Array): Promise<LinkMetaResult> => {
	const meta: Record<string, string> = {};
	const associatedUris: string[] = [];
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
				if (!rel || !href || !href.startsWith('at://') || associatedUris.includes(href)) {
					return;
				}
				// rel may carry several space-separated tokens, e.g. `site.standard.document external`.
				if (
					rel
						.toLowerCase()
						.split(/\s+/)
						.some((token) => STANDARD_SITE_RELS.has(token))
				) {
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

	const pick = (...keys: string[]): string | undefined => {
		for (const key of keys) {
			const value = meta[key]?.trim();
			if (value) {
				return value;
			}
		}
		return undefined;
	};

	const title = pick('og:title', 'twitter:title') ?? (decodeHtmlEntities(titleText).trim() || undefined);
	let description = pick('og:description', 'twitter:description', 'description');

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
		image: pick('og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'),
		title,
	};
};
