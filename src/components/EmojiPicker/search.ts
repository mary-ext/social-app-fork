import { definite, range, unique } from '@mary/array-fns';

/**
 * builds search haystacks for visible emoji.
 *
 * @param columns search columns and the predicate for visible emoji
 * @returns index-addressed haystacks
 */
export function buildHaystacks(columns: {
	emoticons: string[];
	ids: string[];
	keywords: string[];
	names: string[];
	shown: (index: number) => boolean;
}): string[] {
	return columns.ids.map((id, index) => {
		if (!columns.shown(index)) {
			return '';
		}
		// include the full id for exact matches.
		const terms = definite(
			[
				id,
				...id.split('_'),
				columns.names[index]!,
				columns.keywords[index]!,
				columns.emoticons[index]!,
			].flatMap((field) => field.toLowerCase().split(/\s+/)),
		);
		return `,${unique(terms).join(',')}`;
	});
}

/**
 * ranks emoji haystacks for a query.
 *
 * @param options haystacks, ids, query, and result limit
 * @returns matching emoji indices, best match first
 */
export function searchHaystacks(options: {
	haystacks: readonly string[];
	ids: readonly string[];
	limit: number;
	query: string;
}): number[] {
	const { haystacks, ids, limit } = options;
	const words = unique(
		definite(
			options.query
				.toLowerCase()
				.replace(/(\w)-/, '$1 ')
				.split(/[\s|,]+/),
		),
	);
	if (!words.length) {
		return [];
	}

	let pool = range(0, haystacks.length);
	let scores = new Map<number, number>();
	for (const word of words) {
		if (!pool.length) {
			break;
		}
		const matched: number[] = [];
		const needle = `,${word}`;
		// rank by the final query word.
		scores = new Map();
		for (const index of pool) {
			const at = haystacks[index]!.indexOf(needle);
			if (at === -1) {
				continue;
			}
			matched.push(index);
			scores.set(index, ids[index] === word ? 0 : at + 1);
		}
		pool = matched;
	}

	if (pool.length < 2) {
		return pool;
	}

	pool.sort((a, b) => {
		const scoreA = scores.get(a)!;
		const scoreB = scores.get(b)!;
		return scoreA === scoreB ? ids[a]!.localeCompare(ids[b]!) : scoreA - scoreB;
	});
	return pool.length > limit ? pool.slice(0, limit) : pool;
}
