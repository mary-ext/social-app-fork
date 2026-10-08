'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type SyntheticEvent, useEffect, useLayoutEffect } from 'react';

import { isMouseLike } from '#/lib/browser/input-modality';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { type FocusTarget, getFirstTabbable, resolveFocusTarget } from '../focus';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { leaveModal } from '../top-layer';
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

	const focusInitial = useNonReactiveCallback(() => {
		const popup = popupRef.current;
		if (!popup || !managesFocus) {
			return;
		}
		const target = resolveFocusTarget(initialFocus, ctx.openMethod, () => getFirstTabbable(popup));
		target?.focus();
	});

	const focusFinal = useNonReactiveCallback(() => {
		const focusedInside = leaveModal(ctx.positionerRef.current);
		// preserve focus moved outside by the user.
		if (!managesFocus || !focusedInside) {
			return;
		}
		const target = resolveFocusTarget(finalFocus, ctx.closeMethodRef.current, () => ctx.activeTrigger);
		target?.focus();
	});

	// focus after the positioner enters the top layer.
	useEffect(() => {
		if (open) {
			focusInitial();
		}
	}, [open, focusInitial]);

	useLayoutEffect(() => {
		if (!open) {
			focusFinal();
		}
	}, [open, focusFinal]);

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
