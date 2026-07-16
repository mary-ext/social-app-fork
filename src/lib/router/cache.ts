export interface CacheEntryRef {
	readonly index: number;
	readonly key: string;
}

export interface CachePolicy {
	readonly max: number;
}

/**
 * computes which history entries to keep warm based on active index and recency.
 *
 * retains the active entry plus backward entries using an LRU policy. forward entries are dropped.
 */
export const computeCachedKeys = (
	entries: readonly CacheEntryRef[],
	activeIndex: number,
	recency: readonly string[],
	policy: CachePolicy,
): Set<string> => {
	const cached = new Set<string>();

	const active = entries.find((entry) => entry.index === activeIndex);
	if (active === undefined) {
		throw new Error(`stacker: no history entry at active index ${activeIndex}`);
	}
	cached.add(active.key);

	const backward = new Map<string, CacheEntryRef>();
	for (const entry of entries) {
		if (entry.index < activeIndex) {
			backward.set(entry.key, entry);
		}
	}

	let kept = 0;
	const take = (key: string): void => {
		if (kept >= policy.max || cached.has(key) || !backward.has(key)) {
			return;
		}
		cached.add(key);
		kept += 1;
	};

	for (const key of recency) {
		take(key);
	}
	for (const entry of [...backward.values()].toSorted((a, b) => b.index - a.index)) {
		take(entry.key);
	}

	return cached;
};
