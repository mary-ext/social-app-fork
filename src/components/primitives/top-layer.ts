import type { DialogHTMLAttributes, HTMLAttributes } from 'react';

/**
 * shows an open popover in the top layer. leaves it shown on close for exit transitions before unmounting.
 *
 * @param open current open state
 * @param source invoking element for native Tab order; applied when shown
 * @returns a ref callback for the popover element
 */
export const showInTopLayer = (open: boolean, source?: HTMLElement | null) => {
	return (el: HTMLElement | null): void => {
		if (open && el && !el.matches(':popover-open')) {
			el.showPopover({ source: source ?? undefined });
		}
	};
};

/**
 * shows an open popup as a modal dialog. pair with {@link getDialogProps}.
 *
 * @param open current open state
 * @returns a ref callback for the dialog element
 */
export const showModalInTopLayer = (open: boolean) => {
	return (el: HTMLDialogElement | null): void => {
		if (!open || !el || el.open) {
			return;
		}
		// reopening during an exit transition.
		if (el.matches(':popover-open')) {
			el.hidePopover();
		}
		el.showModal();
	};
};

/**
 * ends modality and keeps the popup in the top layer for exit transitions. call in a close layout effect
 * before restoring focus; closing the dialog may restore pre-open focus natively.
 *
 * @param el popup positioning dialog, or `null`
 * @returns whether focus was in the popup or on the body before closing
 */
export const leaveModal = (el: HTMLDialogElement | null): boolean => {
	const active = document.activeElement;
	const focused = active === document.body || !!el?.contains(active);
	if (el?.open) {
		el.close();
		el.showPopover();
	}
	return focused;
};

/**
 * routes native dialog dismissal through the popup's close handler.
 *
 * @param open current open state
 * @param requestClose receives the native event; returns whether dismissal was accepted
 * @returns props for the dialog element
 */
export const getDialogProps = (
	open: boolean,
	requestClose: (event: Event) => boolean,
): Pick<DialogHTMLAttributes<HTMLDialogElement>, 'onCancel' | 'onClose' | 'popover' | 'role'> => {
	return {
		popover: 'manual',
		role: 'presentation',
		onCancel(event) {
			event.preventDefault();
			requestClose(event.nativeEvent);
		},
		onClose(event) {
			const el = event.currentTarget;
			if (!open || el.open || el.matches(':popover-open')) {
				return;
			}
			// without intervening user activation, close requests can skip `cancel`; reopen if rejected.
			if (!requestClose(event.nativeEvent)) {
				el.showModal();
			}
		},
	};
};

/**
 * configures a hint popover: replaces other hints, leaves auto popovers open.
 *
 * @param requestClose receives the native event when the browser closes the hint
 * @returns props for the popover element
 */
export const getHintProps = (
	requestClose: (event: Event) => void,
): Pick<HTMLAttributes<HTMLElement>, 'onToggle' | 'popover'> => {
	return {
		// browsers without hint support treat it as manual.
		popover: 'hint',
		onToggle(event) {
			if (event.newState === 'closed') {
				requestClose(event.nativeEvent);
			}
		},
	};
};

