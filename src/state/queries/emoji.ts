import { queryOptions } from '@tanstack/react-query';

import { GCTIME, STALE } from '#/lib/query/const';

import { loadEmojiDataset, loadEmojiSearch } from '#/features/emoji-picker/data';

/**
 * returns query options for the emoji dataset.
 *
 * @returns emoji dataset query options
 */
export function emojiDatasetQuery() {
	return queryOptions({
		gcTime: GCTIME.MINUTES.FIVE,
		queryFn: ({ signal }) => loadEmojiDataset(signal),
		queryKey: ['emoji-dataset'],
		staleTime: STALE.INFINITY,
	});
}

/**
 * returns query options for the emoji search index.
 *
 * @returns emoji search query options
 */
export function emojiSearchQuery() {
	return queryOptions({
		gcTime: GCTIME.MINUTES.FIVE,
		queryFn: ({ client, signal }) =>
			loadEmojiSearch(signal, () => client.ensureQueryData(emojiDatasetQuery())),
		queryKey: ['emoji-search'],
		staleTime: STALE.INFINITY,
	});
}
