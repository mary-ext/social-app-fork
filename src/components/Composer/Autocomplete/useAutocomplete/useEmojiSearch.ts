import { useQueryClient } from '@tanstack/react-query';

import type { AutocompleteEmoji } from '#/components/Composer/Autocomplete/types';
import { emojiDatasetQuery, emojiSearchQuery } from '#/components/EmojiPicker/data';

/** returns an emoji search function over the shared emoji dataset. */
export function useEmojiSearch(): (query: string, limit?: number) => Promise<AutocompleteEmoji[]> {
	const queryClient = useQueryClient();
	return async (query: string, limit: number = 8) => {
		const [dataset, search] = await Promise.all([
			queryClient.fetchQuery(emojiDatasetQuery()),
			queryClient.fetchQuery(emojiSearchQuery()),
		]);
		return search(query, limit).map((index) => ({
			type: 'emoji' as const,
			key: dataset.ids[index]!,
			label: dataset.names[index]!,
			value: dataset.natives[index]!,
		}));
	};
}
