'use no memo'; // composition props usually invalidate the generated wrapper caches

import { Popup as DialogPopup, type PopupProps } from '../dialog/Popup';

export type { PopupProps, PopupState } from '../dialog/Popup';

/**
 * renders a {@link DialogPopup} with `role="alertdialog"`.
 *
 * @param props content, focus targets, and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = (props: PopupProps) => {
	return <DialogPopup {...props} role="alertdialog" />;
};
