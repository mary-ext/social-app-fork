import { getGraphemeLength } from '@atcute/util-text';

import type { Plot } from 'wordgard/doc';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { getShortenedLength } from '#/lib/rich-text';
import { toShortUrl } from '#/lib/utils/url';

import { buildSpans } from '#/components/Composer/rich-text';

import { getChildPlots, getPostText } from './schema';

/** a post's text measured against the post limit. */
export type PostText = {
	/** grapheme count after link shortening. */
	length: number;
	/** UTF-16 overflow offset, or null; overflowing links are highlighted from their start. */
	overflowAt: number | null;
	/** UTF-16 ranges of highlighted facets. */
	facets: [number, number][];
};

const segmenter = new Intl.Segmenter();

/**
 * maps text offsets of a post (lines joined with newlines) to document positions.
 *
 * @param post the post plot
 * @param start document position of the post's content start
 * @returns the mapping function; calls are fastest with offsets in ascending order
 */
export const createOffsetMapper = (post: Plot, start: number): ((textOffset: number) => number) => {
	const lineStarts: number[] = [];
	const lineDocStarts: number[] = [];

	let offset = 0;
	let pos = start;
	for (const line of getChildPlots(post)) {
		lineStarts.push(offset);
		lineDocStarts.push(pos + 1);
		offset += line.contentLength + 1;
		pos += line.length;
	}

	// reuse the line index for sequential offsets.
	let i = 0;
	return (textOffset: number) => {
		while (i > 0 && lineStarts[i]! > textOffset) {
			i--;
		}
		while (i + 1 < lineStarts.length && lineStarts[i + 1]! <= textOffset) {
			i++;
		}
		return lineDocStarts[i]! + (textOffset - lineStarts[i]!);
	};
};

const measurePost = (text: string): PostText => {
	const facets: [number, number][] = [];
	let raw = 0;
	let shown = 0;
	let overflowAt: number | null = null;

	for (const span of buildSpans(text)) {
		const isLink = span.facet === 'url';
		const shownLength = isLink ? getGraphemeLength(toShortUrl(span.raw)) : getGraphemeLength(span.raw);

		if (overflowAt === null && shown + shownLength > MAX_POST_GRAPHEME_LENGTH) {
			if (isLink) {
				// a shortened link counts as a unit, so the overflow starts at the whole link.
				overflowAt = raw;
			} else {
				let count = shown;
				for (const { index } of segmenter.segment(span.raw)) {
					if (count === MAX_POST_GRAPHEME_LENGTH) {
						overflowAt = raw + index;
						break;
					}

					count++;
				}
			}
		}

		if (span.facet) {
			facets.push([raw, raw + span.raw.length]);
		}

		raw += span.raw.length;
		shown += shownLength;
	}

	// per-span counts can split grapheme clusters at facet boundaries. use the shared whole-text
	// measure for the reported length; the overflow offset remains span-based.
	return { length: getShortenedLength(text), overflowAt, facets };
};

// unchanged posts retain node identity, so their measurements can be reused.
const measured = new WeakMap<Plot, { text: string; measurement: PostText }>();

/**
 * reads and measures a post's text, reusing the result for unchanged posts.
 *
 * @param post the post plot
 * @returns the post's text and its measurement
 */
export const measureCached = (post: Plot): { text: string; measurement: PostText } => {
	const hit = measured.get(post);
	if (hit) {
		return hit;
	}

	const text = getPostText(post);
	const entry = { text, measurement: measurePost(text) };
	measured.set(post, entry);

	return entry;
};
