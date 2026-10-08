'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRootContext } from '../dialog/shared';
import { Viewport as DialogViewport, type ViewportProps } from '../dialog/Viewport';
import { useSwipeDirection } from './shared';
import { useSwipeDismiss } from './use-swipe-dismiss';

export type { ViewportProps } from '../dialog/Viewport';

/**
 * renders a {@link DialogViewport} with swipe dismissal.
 *
 * @param props element props
 * @returns the viewport element; a `<dialog>` by default, or `null` while unmounted
 */
export const Viewport = ({ children, ...props }: ViewportProps) => {
	return (
		<DialogViewport {...props}>
			{children}
			<SwipeDismiss />
		</DialogViewport>
	);
};

// renders after the popup and backdrop so their refs are attached before its effects run.
const SwipeDismiss = () => {
	useSwipeDismiss(useRootContext(), useSwipeDirection());
	return null;
};
