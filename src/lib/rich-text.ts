import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import RichtextBuilder from '@atcute/bluesky-richtext-builder';
import { type Token, tokenize } from '@atcute/bluesky-richtext-parser';
import { segmentize } from '@atcute/bluesky-richtext-segmenter';
import type { Did, GenericUri, Handle } from '@atcute/lexicons';
import { isHandle } from '@atcute/lexicons/syntax';
import { getGraphemeLength } from '@atcute/util-text';

import { mapDefined, unique } from '@mary/array-fns';

import { isMisleadingLink } from '#/lib/links/trust';
import { toShortUrl } from '#/lib/utils/url';

export type RichtextFacet = AppBskyRichtextFacet.Main;

/** A post's rich text, decomposed into its plain text and the facets that decorate it. */
export type Richtext = {
	text: string;
	facets?: RichtextFacet[];
};

/** a parsed or segmented rich-text run. */
type RichtextSegment =
	| { type: 'link'; text: string; uri: GenericUri }
	| { type: 'mention'; text: string; did: Did }
	| { type: 'tag'; text: string; tag: string }
	| { type: 'text'; text: string }
	| { type: 'unresolvedMention'; text: string; handle: Handle };

const toSegment = (token: Token): RichtextSegment => {
	switch (token.type) {
		case 'mention':
			if (!isHandle(token.handle)) {
				return { type: 'text', text: token.raw };
			}

			return { type: 'unresolvedMention', text: token.raw, handle: token.handle };
		case 'topic':
			return { type: 'tag', text: token.raw, tag: token.name };
		case 'autolink':
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the parser only emits `autolink` for `http(s)://` runs
			return { type: 'link', text: token.raw, uri: token.url as GenericUri };
		default:
			// unsupported facets stay literal; `content` can omit merged or invalid syntax
			return { type: 'text', text: token.raw };
	}
};

/**
 * joins segment display text.
 *
 * @param segments rich-text segments
 * @returns joined display text
 */
export function toPlainText(segments: RichtextSegment[]): string {
	return segments.reduce((text, segment) => text + segment.text, '');
}

/**
 * parses inline syntax into rich-text segments with unresolved mentions.
 *
 * @param text the source text
 * @returns parsed segments
 */
export function parseRichtext(text: string): RichtextSegment[] {
	return tokenize(text).map(toSegment);
}

/**
 * converts network rich text to segments without parsing inline syntax.
 *
 * @param richtext network rich text
 * @returns segmented rich text
 */
export function segmentizeRichtext({ text, facets }: Richtext): RichtextSegment[] {
	if (!facets?.length) {
		return [{ type: 'text', text }];
	}

	return segmentize(text, facets).map((segment): RichtextSegment => {
		// use the first supported feature in wire order
		for (const feature of segment.features ?? []) {
			switch (feature.$type) {
				case 'app.bsky.richtext.facet#link':
					return { type: 'link', text: segment.text, uri: feature.uri };
				case 'app.bsky.richtext.facet#mention':
					return { type: 'mention', text: segment.text, did: feature.did };
				case 'app.bsky.richtext.facet#tag':
					return { type: 'tag', text: segment.text, tag: feature.tag };
			}
		}
		return { type: 'text', text: segment.text };
	});
}

/**
 * resolves valid mention handles and leaves failed resolutions unresolved.
 *
 * @param segments rich-text segments
 * @param resolve the handle resolver
 * @returns resolved segments
 */
export async function resolveMentions(
	segments: RichtextSegment[],
	resolve: (handle: Handle) => Promise<Did | undefined>,
): Promise<RichtextSegment[]> {
	const handles = unique(
		mapDefined(segments, (segment) => {
			if (segment.type === 'unresolvedMention') {
				return segment.handle;
			}
		}),
	);

	const resolved = new Map<string, Did | undefined>();
	await Promise.all(
		handles.map(async (handle) => {
			resolved.set(handle, await resolve(handle));
		}),
	);

	return segments.map((segment) => {
		if (segment.type !== 'unresolvedMention') {
			return segment;
		}
		const did = resolved.get(segment.handle);
		return did ? { type: 'mention', text: segment.text, did } : segment;
	});
}

/**
 * shortens link display text.
 *
 * @param segments rich-text segments
 * @returns segments with shortened links
 */
export function shortenLinks(segments: RichtextSegment[]): RichtextSegment[] {
	return segments.map((segment) => {
		return segment.type === 'link' ? { ...segment, text: toShortUrl(segment.text) } : segment;
	});
}

/**
 * restores full URLs in link text that represents its target.
 *
 * @param segments rich-text segments
 * @returns segments with full link text
 */
export function unshortenLinks(segments: RichtextSegment[]): RichtextSegment[] {
	return segments.map((segment) => {
		return segment.type === 'link' && !isMisleadingLink(segment.uri, segment.text)
			? { ...segment, text: segment.uri }
			: segment;
	});
}

/**
 * converts segments to network rich text; unresolved mentions become plain text.
 *
 * @param segments rich-text segments
 * @returns network rich text
 */
export function bakeRichtext(segments: RichtextSegment[]): Richtext {
	const builder = new RichtextBuilder();
	for (const segment of segments) {
		switch (segment.type) {
			case 'link':
				builder.addLink(segment.text, segment.uri);
				break;
			case 'mention':
				builder.addMention(segment.text, segment.did);
				break;
			case 'tag':
				builder.addTag(segment.text, segment.tag);
				break;
			default:
				builder.addText(segment.text);
		}
	}
	return builder.build();
}

/**
 * counts graphemes after shortening links.
 *
 * @param text source text
 * @returns displayed grapheme count
 */
export function getShortenedLength(text: string): number {
	return getGraphemeLength(toPlainText(shortenLinks(parseRichtext(text))));
}

/**
 * converts rich text to publishable source text.
 *
 * @param rt the rich text
 * @returns source text with full link targets
 */
export function richTextToSourceText(rt: Richtext): string {
	return toPlainText(unshortenLinks(segmentizeRichtext(rt)));
}

/**
 * converts rich text to copyable text with explicit link targets.
 *
 * @param rt the rich text
 * @returns copyable text
 */
export function richTextToCopyableText(rt: Richtext): string {
	let result = '';

	for (const segment of segmentizeRichtext(rt)) {
		if (segment.type !== 'link') {
			result += segment.text;
		} else if (isMisleadingLink(segment.uri, segment.text)) {
			result += `[${segment.text}](${segment.uri})`;
		} else {
			result += segment.uri;
		}
	}

	return result;
}
