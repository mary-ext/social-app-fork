import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { emojiDataQuery } from '#/components/EmojiPicker/data';

/**
 * preloads the emoji dataset.
 *
 * returns a function that triggers preloading (e.g. on hover); when `immediate` is `true`, preloading starts
 * on mount. loading happens at most once per page load.
 */
export function useWebPreloadEmoji({ immediate }: { immediate?: boolean } = {}) {
	const queryClient = useQueryClient();
	const preload = useCallback(() => {
		void queryClient.prefetchQuery(emojiDataQuery());
	}, [queryClient]);
	if (immediate) {
		preload();
	}
	return preload;
}
