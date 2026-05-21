import { useCallback } from 'react';

type SearchIndex = (typeof import('emoji-mart'))['SearchIndex'];

let loadPromise: Promise<SearchIndex> | undefined;

/**
 * Lazily loads and initializes emoji-mart — the library plus its emoji dataset — keeping both out of the
 * initial bundle. Memoized: repeated calls share one load, and a failed load resets so a later call can
 * retry.
 *
 * @returns emoji-mart's initialized search index
 */
export function loadEmojiMart(): Promise<SearchIndex> {
	loadPromise ??= (async () => {
		const [emojiMart, data] = await Promise.all([import('emoji-mart'), import('@emoji-mart/data')]);
		await emojiMart.init({ data: data.default });
		return emojiMart.SearchIndex;
	})().catch((err) => {
		loadPromise = undefined;
		throw err;
	});
	return loadPromise;
}

/**
 * Preloads emoji-mart (library, dataset, and React picker) so the picker renders quickly and emoji search is
 * ready on first use.
 *
 * Returns a function that triggers preloading (e.g. on hover); when `immediate` is `true`, preloading starts
 * on mount. Loading happens at most once per page load.
 *
 * @see {@link https://github.com/missive/emoji-mart/blob/16978d04a766eec6455e2e8bb21cd8dc0b3c7436/README.md?plain=1#L194 | emoji-mart preloading docs}
 */
export function useWebPreloadEmoji({ immediate }: { immediate?: boolean } = {}) {
	const preload = useCallback(() => {
		void loadEmojiMart().catch(() => {});
		void import('@emoji-mart/react').catch(() => {});
	}, []);
	if (immediate) preload();
	return preload;
}
