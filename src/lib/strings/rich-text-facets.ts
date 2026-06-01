import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import RichtextBuilder from '@atcute/bluesky-richtext-builder';
import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';
import type { Did, GenericUri } from '@atcute/lexicons';
import { countGraphemes } from 'unicode-segmenter/grapheme';

import { toShortUrl } from './url-helpers';

export type RichtextFacet = AppBskyRichtextFacet.Main;

/** A post's rich text, decomposed into its plain text and the facets that decorate it. */
export type Richtext = {
	text: string;
	facets?: RichtextFacet[];
};

// Collapses runs of 3+ newlines (allowing zero-width separators between them) down to a blank line.
// eslint-disable-next-line no-misleading-character-class
const EXCESS_NEWLINES_RE = /[\r\n]([\u00AD\u2060\u200D\u200C\u200B\s]*[\r\n]){2,}/g;

/**
 * Collapses runs of three or more newlines down to a single blank line, matching `@atproto/api`'s `RichText`
 * `cleanNewlines` option.
 *
 * @param text the text to sanitize.
 * @returns the text with excess blank lines removed.
 */
export function cleanNewlines(text: string): string {
	return text.replace(EXCESS_NEWLINES_RE, '\n\n');
}

/**
 * Counts the graphemes of `text` as it will be displayed, with link URLs replaced by their shortened form —
 * the value a composer's character counter shows.
 *
 * @param text the compose-input text.
 * @returns the shortened grapheme length.
 */
export function getShortenedLength(text: string): number {
	let shortened = '';
	for (const token of tokenize(text)) {
		shortened += token.type === 'autolink' ? toShortUrl(token.url) : token.raw;
	}
	return countGraphemes(shortened);
}

/**
 * Appends a parser token to a richtext builder: only mentions, hashtags, and scheme-prefixed autolinks become
 * facets; the parser's extended markdown syntax is emitted as literal text. Unlike `@atproto/api`,
 * bare-domain autolinks (`bsky.app` with no scheme) and cashtags are intentionally not faceted — an accepted
 * tradeoff of the @atcute parser. `resolveDid` maps a mention handle to a DID, or returns undefined to render
 * the mention as plain text.
 */
function appendToken(
	builder: RichtextBuilder,
	token: Token,
	resolveDid: (handle: string) => Did | undefined,
): void {
	switch (token.type) {
		case 'text':
			// the tokenizer merges adjacent text runs into `raw` only, leaving `content` holding just the
			// first run; use `raw` so failed-facet text (`$5`, `16:9`, a stray `:`) isn't truncated.
			builder.addText(token.raw);
			break;
		case 'mention': {
			const did = resolveDid(token.handle);
			if (did) {
				builder.addMention(token.raw, did);
			} else {
				builder.addText(token.raw);
			}
			break;
		}
		case 'topic':
			builder.addTag(token.raw, token.name);
			break;
		case 'autolink':
			builder.addLink(token.raw, token.url as GenericUri);
			break;
		default:
			// markdown links/formatting, code, cashtags, emotes and escapes carry no facet — emit them as
			// the literal text the user typed (cashtag faceting is intentionally unsupported).
			builder.addText(token.raw);
	}
}

/**
 * Detects facets in `text` without resolving mention handles to DIDs — each handle is stored in the mention
 * facet's `did` slot, matching `@atproto/api`'s `detectFacetsWithoutResolution()`. The resulting mention
 * facets are not lexicon-valid and only render as links when the consumer opts in.
 *
 * @param text the input text.
 * @returns the text and its detected facets.
 */
export function detectFacetsWithoutResolution(text: string): Richtext {
	const builder = new RichtextBuilder();
	for (const token of tokenize(text)) {
		appendToken(builder, token, (handle) => handle as Did);
	}
	return builder.build();
}

/**
 * Detects facets in `text`, resolving each mention handle to a DID via `resolve`. Mentions whose handle does
 * not resolve are rendered as plain text.
 *
 * @param text the input text.
 * @param resolve maps a handle to a DID, or undefined when it cannot be resolved.
 * @returns the text and its detected facets.
 */
export async function detectFacets(
	text: string,
	resolve: (handle: string) => Promise<Did | undefined>,
): Promise<Richtext> {
	const tokens = tokenize(text);
	const handles = [
		...new Set(tokens.filter((token) => token.type === 'mention').map((token) => token.handle)),
	];
	const resolved = new Map<string, Did | undefined>();
	await Promise.all(
		handles.map(async (handle) => {
			resolved.set(handle, await resolve(handle));
		}),
	);

	const builder = new RichtextBuilder();
	for (const token of tokens) {
		appendToken(builder, token, (handle) => resolved.get(handle));
	}
	return builder.build();
}
