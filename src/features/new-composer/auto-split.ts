import { buildSpans } from '#/components/Composer/rich-text';

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
export const splitText = (text: string, limit: number, measure: (chunk: string) => number): string[] => {
	const chunks: string[] = [];
	let rest = text.trim();

	while (measure(rest) > limit) {
		const unbreakable = getUnbreakableRanges(rest);
		const boundaries = getBoundarySet(rest);

		const fits = findLongestFit(rest, limit, measure);

		const isBreakable = (offset: number) => {
			return boundaries.has(offset) && !unbreakable.some(([from, to]) => offset > from && offset < to);
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
				if (end > cut && isBreakable(end) && boundaries.has(resume) && fitsHere) {
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
		rest = rest.slice(next).trimStart();
	}

	chunks.push(rest);
	return chunks;
};
