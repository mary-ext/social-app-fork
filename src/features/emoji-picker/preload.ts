import { useQueryClient } from '@tanstack/react-query';

import { emojiDatasetQuery } from '#/features/emoji-picker/data';

/**
 * preloads the emoji dataset and picker panel.
 *
 * @returns the preload function.
 */
export function useEmojiPreload({ immediate }: { immediate?: boolean } = {}) {
	const queryClient = useQueryClient();
	const preload = () => {
		void queryClient.prefetchQuery(emojiDatasetQuery());
		void import('#/features/emoji-picker/EmojiPanel');
	};
	if (immediate) {
		preload();
	}
	return preload;
}
