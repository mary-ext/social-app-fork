import type { Wordgard } from 'wordgard/editor';

import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';
import { getShortenedLength } from '#/lib/rich-text';

import { buildSpans } from '#/components/Composer/rich-text';

import { ISOLATE_HISTORY } from '../model/history';
import {
	createPosts,
	endOfLastLine,
	findPostById,
	getPostParam,
	getPostText,
	newPost,
	Post,
} from '../model/schema';

// break points in preference order; matches end at the next chunk's start.
const BREAK_TIERS = [
	// blank lines, then line breaks
	/\n\s*\n\s*/g,
	/\n\s*/g,
	// sentence ends
	/[.!?…。！？]["'”’)\]]*\s+/g,
	// clause punctuation
	/[,;:—–]\s+/g,
	// any whitespace
	/\s+/g,
];

// try a lower-priority break if the chunk is less than half full.
const MIN_FILL = 0.5;

// link shortening allows more raw text than the limit; expand the search window as needed.
const SEGMENT_HEADROOM = 8;

const segmenter = new Intl.Segmenter();

/** text ranges that must not be broken, such as links and mentions. */
const getUnbreakableRanges = (text: string): [number, number][] => {
	const ranges: [number, number][] = [];
	let offset = 0;
	for (const span of buildSpans(text)) {
		if (span.facet) {
			ranges.push([offset, offset + span.raw.length]);
		}
		offset += span.raw.length;
	}
	return ranges;
};

// regex breaks can split grapheme clusters, e.g. a space followed by a combining mark.
const getBoundarySet = (text: string): Set<number> => {
	const boundaries = new Set<number>([0]);
	for (const { index, segment } of segmenter.segment(text)) {
		boundaries.add(index + segment.length);
	}

	return boundaries;
};

/** grapheme boundaries of `text`, up to `bound` characters in. */
const getBoundaries = (text: string, bound: number): number[] => {
	const boundaries: number[] = [];
	for (const { index, segment } of segmenter.segment(text)) {
		if (index >= bound) {
			break;
		}
		boundaries.push(index + segment.length);
	}

	return boundaries;
};

/** finds a fitting grapheme boundary using binary search to reduce link-shortening measurements. */
const findLongestFit = (text: string, limit: number, measure: (chunk: string) => number): number => {
	for (let bound = limit * SEGMENT_HEADROOM; ; bound *= 2) {
		const boundaries = getBoundaries(text, bound);
		if (boundaries.length === 0) {
			return 0;
		}

		let lo = 0;
		let hi = boundaries.length - 1;
		while (lo < hi) {
			const mid = Math.ceil((lo + hi) / 2);
			if (measure(text.slice(0, boundaries[mid])) <= limit) {
				lo = mid;
			} else {
				hi = mid - 1;
			}
		}

		// expand the search if the entire window fits.
		if (lo === boundaries.length - 1 && bound < text.length) {
			continue;
		}

		return boundaries[lo] ?? 0;
	}
};

/**
 * splits text at paragraph, sentence, clause, or word boundaries, in that order of preference. avoids
 * splitting facets where possible; falls back to a grapheme boundary when no break fits.
 *
 * @param text the text to split
 * @param limit the maximum length of a chunk
 * @param measure measures a chunk's length, as counted against the limit
 * @returns the chunks, trimmed, with at least one entry
 */
const splitText = (text: string, limit: number, measure: (chunk: string) => number): string[] => {
	const full = text.trim();
	// reuse full-text ranges and boundaries by adding `base` to each chunk's offsets.
	const unbreakable = getUnbreakableRanges(full);
	const boundaries = getBoundarySet(full);

	const chunks: string[] = [];
	let base = 0;
	let rest = full;

	while (measure(rest) > limit) {
		const fits = findLongestFit(rest, limit, measure);

		const isBoundary = (offset: number) => boundaries.has(base + offset);
		const isBreakable = (offset: number) => {
			const at = base + offset;
			return isBoundary(offset) && !unbreakable.some(([from, to]) => at > from && at < to);
		};

		let cut = -1;
		let next = -1;
		for (const tier of BREAK_TIERS) {
			for (const match of rest.slice(0, fits + 1).matchAll(tier)) {
				// punctuation stays with the text before the break, whitespace goes.
				const end = match.index + match[0].trimEnd().length;
				// anything at or below `fits` is known to fit, so only a later break needs measuring.
				const fitsHere = end <= fits || measure(rest.slice(0, end)) <= limit;
				// the next chunk must also start at a grapheme boundary.
				const resume = match.index + match[0].length;

				// a lower tier only helps when it breaks later than the higher tier's pick.
				if (end > cut && isBreakable(end) && isBoundary(resume) && fitsHere) {
					cut = end;
					next = resume;
				}
			}

			if (cut >= fits * MIN_FILL) {
				break;
			}
		}

		if (cut <= 0) {
			// nothing to break at; cut at the last grapheme that fits.
			cut = next = Math.max(fits, 1);
		}

		chunks.push(rest.slice(0, cut).trimEnd());
		const after = rest.slice(next);
		rest = after.trimStart();
		base += next + after.length - rest.length;
	}

	chunks.push(rest);
	return chunks;
};

/**
 * splits an overlong post at text boundaries, keeping its media on the last post.
 *
 * @param wg the editor
 * @param postId the post's id
 */
export const autoSplitPost = (wg: Wordgard, postId: string): void => {
	const post = findPostById(wg.state.doc, postId);
	if (!post) {
		return;
	}

	const chunks = splitText(getPostText(post.node), MAX_POST_GRAPHEME_LENGTH, getShortenedLength);
	if (chunks.length < 2) {
		return;
	}

	// preserve the original post's id on the first chunk.
	const param = getPostParam(post.node);
	const posts = createPosts(chunks).map((plot, i) => {
		if (i === 0) {
			return Post.of({ id: param.id, media: [] }).create(plot.content);
		}
		return i === chunks.length - 1 ? newPost(param.media).create(plot.content) : plot;
	});

	const end = post.pos + posts.reduce((length, plot) => length + plot.length, 0);

	wg.dispatch({
		changes: { from: post.pos, to: post.pos + post.node.length, insert: posts },
		selection: { anchor: endOfLastLine(end) },
		scrollIntoView: true,
		userEvent: 'input.split',
		annotations: ISOLATE_HISTORY,
	});
};
