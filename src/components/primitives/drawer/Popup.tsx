'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useEffect, useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { type FocusTarget, resolveFocusTarget } from '../focus';
import { openStateAttributes } from '../presence';
import type { SwipeDirection } from '../swipe';
import { leaveModal } from '../top-layer';
import { useRootContext } from './shared';

export type PopupState = {
	open: boolean;
	swipeDirection: SwipeDirection;
};

export type PopupProps = useRender.ComponentProps<'div', PopupState> & {
	/** focus target on open; defaults to the popup. */
	initialFocus?: FocusTarget;
	/** element to focus on close, when focus was inside; defaults to the trigger. */
	finalFocus?: FocusTarget;
};

const popupStateAttributes = {
	...openStateAttributes,
	swipeDirection: (direction: SwipeDirection): Record<string, string> => ({
		'data-swipe-direction': direction,
	}),
};

/**
 * renders the drawer's sliding surface inside `Viewport`. style entry with `@starting-style` and exit with
 * `[data-closed]`. `data-swiping` marks active drags on the popup and backdrop; `data-swipe-dismiss` marks
 * swipe exits. see `css-vars.ts` for swipe offsets and exit timing.
 *
 * @param props content, focus targets, and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({
	render,
	ref,
	initialFocus = true,
	finalFocus = true,
	...elementProps
}: PopupProps) => {
	const ctx = useRootContext();
	const { open, popupRef, swipeDirection } = ctx;

	const focusInitial = useNonReactiveCallback(() => {
		const popup = popupRef.current;
		if (!popup) {
			return;
		}
		resolveFocusTarget(initialFocus, ctx.openMethod, () => popup)?.focus({ preventScroll: true });
	});

	const focusFinal = useNonReactiveCallback(() => {
		const focusedInside = leaveModal(ctx.viewportRef.current);
		// preserve focus moved outside by the user.
		if (!focusedInside) {
			return;
		}
		resolveFocusTarget(finalFocus, ctx.closeMethodRef.current, () => ctx.activeTrigger)?.focus();
	});

	// focus after the viewport enters the top layer.
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

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: ctx.popupId,
		role: 'dialog',
		tabIndex: -1,
		'aria-labelledby': ctx.labels.title ? ctx.titleId : undefined,
		'aria-describedby': ctx.labels.description ? ctx.descriptionId : undefined,
	};

	return useRender({
		render,
		ref: [ref ?? null, popupRef],
		state: { open, swipeDirection },
		stateAttributesMapping: popupStateAttributes,
		props: mergeProps<'div'>(internalProps, elementProps),
	});
};
