'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type SyntheticEvent, useEffect, useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { isMouseLike } from '#/lib/browser/input-modality';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { openStateAttributes } from '../anchored-popup';
import {
	type FocusTarget,
	getFirstTabbable,
	getNextTabbable,
	getTabbables,
	resolveFocusTarget,
} from '../focus';
import { useRootContext } from './shared';

export type PopupState = {
	open: boolean;
};

export type PopupProps = useRender.ComponentProps<'div', PopupState> & {
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
	const { open, openReason, popupRef, setOpen, timeout } = ctx;
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
		const popup = popupRef.current;
		const active = document.activeElement;
		// preserve focus moved outside by the user.
		if (!managesFocus || (active !== document.body && !popup?.contains(active))) {
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

	// restore focus before the positioner's layout effect makes it inert.
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
		onKeyDown(event) {
			const popup = popupRef.current;
			const trigger = ctx.activeTrigger;
			if (event.key !== 'Tab' || ctx.modal || !popup || !trigger) {
				return;
			}

			// a portal changes DOM order; resume tabbing relative to the trigger.
			const tabbables = getTabbables(popup);
			if (event.shiftKey) {
				if (event.target === popup || event.target === tabbables[0]) {
					event.preventDefault();
					trigger.focus();
				}
			} else if (event.target === (tabbables.at(-1) ?? popup)) {
				const next = getNextTabbable(trigger, ctx.positionerRef.current);
				if (next) {
					event.preventDefault();
					next.focus();
				} else {
					setOpen(false, { reason: 'focus-out', event: event.nativeEvent });
				}
			}
		},
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
		render,
		ref: [ref ?? null, popupRef],
		state: { open },
		stateAttributesMapping: openStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
