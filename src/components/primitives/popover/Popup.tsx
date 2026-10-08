'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes, SyntheticEvent } from 'react';

import { isMouseLike } from '#/lib/browser/input-modality';

import { type FocusTarget, getFirstTabbable, resolveFocusTarget } from '../focus';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useModalFocus } from '../top-layer';
import { useRootContext } from './shared';

export type PopupProps = RenderProps<'div'> & {
	/**
	 * focus target on open; defaults to the first tabbable element, or the popup if none. touch opens leave
	 * focus unchanged to avoid showing the virtual keyboard.
	 */
	initialFocus?: FocusTarget;
	/** element to focus on close, when focus was inside; defaults to the trigger. */
	finalFocus?: FocusTarget;
};

const defaultInitialFocus: FocusTarget = (type) => type !== 'touch';

/**
 * renders popover content as a dialog. hover opens leave focus unchanged.
 *
 * @param props content, focus targets, and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({
	render,
	ref,
	initialFocus = defaultInitialFocus,
	finalFocus = true,
	...elementProps
}: PopupProps) => {
	const ctx = useRootContext();
	const { open, openReason, popupRef, timeout } = ctx;
	const managesFocus = openReason !== 'trigger-hover';

	useModalFocus(open, ctx.positionerRef, {
		initial() {
			const popup = popupRef.current;
			if (popup && managesFocus) {
				resolveFocusTarget(initialFocus, ctx.openMethod, () => getFirstTabbable(popup))?.focus();
			}
		},
		final() {
			if (managesFocus) {
				resolveFocusTarget(finalFocus, ctx.closeMethodRef.current, () => ctx.activeTrigger)?.focus();
			}
		},
	});

	const markInside = (event: SyntheticEvent) => {
		ctx.markInside(event.nativeEvent);
	};

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: ctx.popupId,
		role: 'dialog',
		tabIndex: -1,
		onClickCapture: markInside,
		onFocusCapture: markInside,
		onKeyDownCapture: markInside,
		onPointerDownCapture: markInside,
		onPointerEnter() {
			if (openReason === 'trigger-hover') {
				timeout.clear();
			}
		},
		onPointerLeave(event) {
			if (openReason === 'trigger-hover' && isMouseLike(event)) {
				ctx.startHoverClose(event.nativeEvent);
			}
		},
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref, popupRef],
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'div'>(getOpenAttributes(open), internalProps, elementProps),
	});
};
