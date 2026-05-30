import { type AppBskyRichtextFacet } from '@atcute/bluesky';
import RichtextBuilder from '@atcute/bluesky-richtext-builder';
import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';
import { type Did, type GenericUri } from '@atcute/lexicons';

export type RichtextFacet = AppBskyRichtextFacet.Main;

/** A post's rich text, decomposed into its plain text and the facets that decorate it. */
export type Richtext = {
	text: string;
	facets?: RichtextFacet[];
};

/**
 * Appends a parser token to a richtext builder, preserving `@atproto/api` parity: only mentions,
 * hashtags, and scheme-prefixed autolinks become facets; the parser's extended markdown syntax is
 * emitted as literal text. `resolveDid` maps a mention handle to a DID, or returns undefined to
 * render the mention as plain text.
 */
function appendToken(
	builder: RichtextBuilder,
	token: Token,
	resolveDid: (handle: string) => Did | undefined,
): void {
	switch (token.type) {
		case 'text':
			builder.addText(token.content);
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
			// markdown links/formatting, code, cashtags, emotes and escapes carry no facet — keep them
			// as the literal text the user typed, matching @atproto/api's non-markdown detection.
			builder.addText(token.raw);
	}
}

/**
 * Detects facets in `text` without resolving mention handles to DIDs — each handle is stored in the
 * mention facet's `did` slot, matching `@atproto/api`'s `detectFacetsWithoutResolution()`. The
 * resulting mention facets are not lexicon-valid and only render as links when the consumer opts in.
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
 * Detects facets in `text`, resolving each mention handle to a DID via `resolve`. Mentions whose
 * handle does not resolve are rendered as plain text.
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
	const handles = [...new Set(tokens.filter((token) => token.type === 'mention').map((token) => token.handle))];
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
