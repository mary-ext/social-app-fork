import { createContext, useContext } from 'react';

import type { SwipeDirection } from '../swipe';

export const SwipeDirectionContext = createContext<SwipeDirection | null>(null);
SwipeDirectionContext.displayName = 'DrawerSwipeDirectionContext';

/**
 * @returns the enclosing drawer's swipe direction
 * @throws if called outside `Root`
 */
export const useSwipeDirection = (): SwipeDirection => {
	const direction = useContext(SwipeDirectionContext);
	if (direction === null) {
		throw new Error(`drawer parts require <Drawer.Root>`);
	}
	return direction;
};

export const CONTENT_ATTRIBUTE = 'data-drawer-content';
