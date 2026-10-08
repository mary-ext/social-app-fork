'use no memo'; // composition props usually invalidate the generated wrapper caches

import { Root as DialogRoot, type RootProps as DialogRootProps } from '../dialog/Root';
import type { SwipeDirection } from '../swipe';
import { SwipeDirectionContext } from './shared';

export type RootProps = Omit<DialogRootProps, 'disablePointerDismissal'> & {
	/** direction the popup travels when swiped closed; defaults to `down`. */
	swipeDirection?: SwipeDirection;
};

/**
 * shares drawer state. while open, outside content is inert and page scrolling is locked.
 *
 * @param props drawer parts, open state, and callbacks
 * @returns the drawer parts without a wrapper element
 */
export const Root = ({ swipeDirection = 'down', ...props }: RootProps) => {
	return (
		<SwipeDirectionContext.Provider value={swipeDirection}>
			<DialogRoot {...props} />
		</SwipeDirectionContext.Provider>
	);
};
