'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useEffect, useLayoutEffect } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { findReturnFocus, type FocusTarget, getFirstTabbable, resolveFocusTarget } from '../focus';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { leaveModal } from '../top-layer';
import { useRootContext } from './shared';

export type PopupProps = RenderProps<'div'> & {
	/**
	 * focus target on open; defaults to the first tabbable element, or the popup on touch to avoid opening the
	 * virtual keyboard.
	 */
	initialFocus?: FocusTarget;
	/**
	 * focus target on close if focus was inside. defaults to the opener, falling back to containing popups'
	 * triggers if the opener is removed or hidden.
	 */
	finalFocus?: FocusTarget;
};

/**
 * renders the dialog's surface inside `Viewport`. style entry with `@starting-style` and exit with
 * `[data-closed]`.
 *
 * @param props content, focus targets, and element props
 * @returns the popup element; a `<div>` by default
 */
export const Popup = ({ render, ref, initialFocus, finalFocus = true, ...elementProps }: PopupProps) => {
	const ctx = useRootContext();
	const { open, popupRef } = ctx;

	const focusInitial = useNonReactiveCallback(() => {
		const popup = popupRef.current;
		if (!popup) {
			return;
		}
		const target = initialFocus ?? ((type) => (type === 'touch' ? popup : true));
		resolveFocusTarget(target, ctx.openMethod, () => getFirstTabbable(popup))?.focus({
			preventScroll: true,
		});
	});

	const focusFinal = useNonReactiveCallback(() => {
		const focusedInside = leaveModal(ctx.viewportRef.current);
		// preserve focus moved outside by the user.
		if (!focusedInside) {
			return;
		}
		// without a usable default, keep the focus that closing the dialog restored natively.
		resolveFocusTarget(finalFocus, ctx.closeMethodRef.current, () =>
			findReturnFocus(ctx.returnFocusRef.current),
		)?.focus();
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
		'aria-modal': true,
		'aria-labelledby': ctx.labels.title ? ctx.titleId : undefined,
		'aria-describedby': ctx.labels.description ? ctx.descriptionId : undefined,
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref, popupRef, autofocus],
		props: mergeProps<'div'>(getOpenAttributes(open), internalProps, elementProps),
	});
};

// `showModal()` focuses its autofocus delegate. without one, it may pick a control deep inside a tall popup
// and scroll the viewport before the initial focus target is chosen.
const autofocus = (el: HTMLDivElement | null): void => {
	if (el) {
		el.autofocus = true;
	}
};
