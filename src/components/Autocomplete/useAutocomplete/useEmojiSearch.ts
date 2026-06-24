import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { AutocompleteEmoji } from '#/components/Autocomplete/types';
import { emojiDataQuery } from '#/components/EmojiPicker/data';

/** returns an emoji search function over the shared emoji dataset. */
export function useEmojiSearch(): (query: string, limit?: number) => Promise<AutocompleteEmoji[]> {
	const queryClient = useQueryClient();
	return useCallback(
		async (query: string, limit: number = 8) => {
			const { search } = await queryClient.fetchQuery(emojiDataQuery());
			return search(query, limit).map((emoji) => ({
				emoji,
				key: emoji.id,
				type: 'emoji' as const,
				value: emoji.skins[0]!.native,
			}));
		},
		[queryClient],
	);
}
