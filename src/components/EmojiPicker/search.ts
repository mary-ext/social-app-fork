import { definite, unique } from '@mary/array-fns';

/** a search entry: an emoji id plus a comma-delimited, lowercased haystack of its searchable terms. */
export type SearchEntry = {
	id: string;
	/** each term is preceded by a comma (`,grin,smile,…`). */
	haystack: string;
};

/**
 * ranks emoji ids against a free-text query: every query word must match, results best-first and capped.
 *
 * @param entries the search entries to rank
 * @param query the search query
 * @param limit maximum number of ids to return
 * @returns the matching emoji ids, best match first
 */
export function searchEmojiIds(entries: readonly SearchEntry[], query: string, limit: number): string[] {
	const words = unique(
		definite(
			query
				.toLowerCase()
				.replace(/(\w)-/, '$1 ')
				.split(/[\s|,]+/),
		),
	);
	if (!words.length) {
		return [];
	}

	let pool = entries;
	let scores = new Map<string, number>();
	for (const word of words) {
		if (!pool.length) {
			break;
		}
		const matched: SearchEntry[] = [];
		const needle = `,${word}`;
		// scores reset each word so the final ranking reflects the last word's match positions (matches emoji-mart)
		scores = new Map();
		for (const entry of pool) {
			const at = entry.haystack.indexOf(needle);
			if (at === -1) {
				continue;
			}
			matched.push(entry);
			scores.set(entry.id, (scores.get(entry.id) ?? 0) + (entry.id === word ? 0 : at + 1));
		}
		pool = matched;
	}

	if (pool.length < 2) {
		return pool.map((entry) => entry.id);
	}

	const ids = pool.map((entry) => entry.id);
	ids.sort((a, b) => {
		const sa = scores.get(a)!;
		const sb = scores.get(b)!;
		return sa === sb ? a.localeCompare(b) : sa - sb;
	});
	return ids.length > limit ? ids.slice(0, limit) : ids;
}
