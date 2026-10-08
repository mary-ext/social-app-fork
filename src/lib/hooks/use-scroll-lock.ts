import { useLayoutEffect } from 'react';

import { lockScroll } from '#/lib/browser/scroll-lock';

/**
 * prevents the page from scrolling while enabled.
 *
 * @param enabled whether to hold the lock
 */
export const useScrollLock = (enabled: boolean): void => {
	useLayoutEffect(() => {
		if (enabled) {
			return lockScroll();
		}
	}, [enabled]);
};
