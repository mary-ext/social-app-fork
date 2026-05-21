import { useCallback } from 'react';

import { type AutocompleteEmoji } from '#/components/Autocomplete/types';
import { loadEmojiMart } from '#/components/EmojiPicker/preload';

/**
 * Returns an emoji search function backed by emoji-mart's own search index. The library and its data are
 * lazy-loaded on first use.
 */
export function useEmojiSearch(): (query: string, limit?: number) => Promise<AutocompleteEmoji[]> {
	return useCallback(async (query: string, limit: number = 8) => {
		const searchIndex = await loadEmojiMart();
		const results: AutocompleteEmoji['emoji'][] | null = await searchIndex.search(query, {
			maxResults: limit,
			caller: 'useEmojiSearch',
		});
		return (results ?? []).map((emoji) => ({
			key: emoji.id,
			type: 'emoji' as const,
			value: emoji.skins[0]!.native,
			emoji,
		}));
	}, []);
}
