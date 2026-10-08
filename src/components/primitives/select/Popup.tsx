'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useEffect, useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { getListItems, getListNavigationProps } from '../list-navigation';
import { openStateAttributes } from '../presence';
import { leaveModal } from '../top-layer';
import { SELECTED_ITEM_SELECTOR, useRootContext } from './shared';

export type PopupState = {
	open: boolean;
};

export type PopupProps = useRender.ComponentProps<'div', PopupState>;

/**
 * renders the listbox. opening focuses the selected item, or the first/last item for keyboard opens without a
 * selection. touch opens focus the listbox without highlighting an item.
 *
 * @param props element props
 * @returns the listbox element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const ctx = useRootContext();
	const { open, popupRef, setOpen, triggerRef } = ctx;

	const focusInitial = useNonReactiveCallback(() => {
		const popup = popupRef.current;
		if (!popup) {
			return;
		}
		const selected = popup.querySelector<HTMLElement>(SELECTED_ITEM_SELECTOR);

		if (selected && ctx.openMethod !== 'touch') {
			selected.focus();
			return;
		}
		if (!selected && ctx.openMethod === 'keyboard') {
			const items = getListItems(popup);
			const entry = ctx.openEntry === 'last' ? items.at(-1) : items[0];
			if (entry) {
				entry.focus();
				return;
			}
		}
		popup.focus({ preventScroll: true });
		selected?.scrollIntoView({ block: 'nearest' });
	});

	const focusFinal = useNonReactiveCallback(() => {
		if (leaveModal(ctx.positionerRef.current)) {
			triggerRef.current?.focus({ preventScroll: true });
		}
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

	const navigationProps = getListNavigationProps({ loop: false, typeahead: ctx.typeahead });

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: ctx.popupId,
		role: 'listbox',
		'aria-labelledby': ctx.triggerId,
		...navigationProps,
		onKeyDown(event) {
			switch (event.key) {
				case 'Escape': {
					if (event.nativeEvent.isComposing) {
						return;
					}
					// prevent Escape from also closing an enclosing dialog.
					event.preventDefault();
					setOpen(false, { reason: 'escape-key', method: 'keyboard' });
					return;
				}
				case 'Tab': {
					// let Tab advance from the restored trigger focus; keep Shift+Tab on the trigger.
					if (event.shiftKey) {
						event.preventDefault();
					}
					setOpen(false, { reason: 'focus-out', method: 'keyboard' });
					return;
				}
			}
			navigationProps.onKeyDown(event);
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
