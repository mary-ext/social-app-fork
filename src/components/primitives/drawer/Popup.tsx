'use no memo'; // composition props usually invalidate the generated wrapper caches

import { Popup as DialogPopup, type PopupProps } from '../dialog/Popup';
import { useRootContext } from '../dialog/shared';
import { useSwipeDirection } from './shared';

export type { PopupProps } from '../dialog/Popup';

/**
 * renders a {@link DialogPopup} that focuses itself on open by default. `data-swipe-direction` identifies the
 * dismissal direction; `data-swiping` marks drags on the popup and backdrop, and `data-swipe-dismiss` marks
 * swipe exits. swipe offsets and timing variables are defined in `css-vars.ts`.
 *
 * @param props content, focus targets, and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({ initialFocus, ...props }: PopupProps) => {
	const { popupRef } = useRootContext();
	const swipeDirection = useSwipeDirection();

	return (
		<DialogPopup data-swipe-direction={swipeDirection} initialFocus={initialFocus ?? popupRef} {...props} />
	);
};
