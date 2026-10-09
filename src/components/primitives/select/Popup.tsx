'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { getListItems, getListNavigationProps } from '../list-navigation';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { isUnclaimedEscape, useModalFocus } from '../top-layer';
import { SELECTED_ITEM_SELECTOR, useRootContext } from './shared';

export type PopupProps = RenderProps<'div'>;

/**
 * renders the listbox. opens focus the selected item, or the first/last item for keyboard opens without a
 * selection. touch opens focus the listbox. scrolls the focused or selected item into view.
 *
 * @param props element props
 * @returns the listbox element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const ctx = useRootContext();
	const { open, popupRef, setOpen, triggerRef } = ctx;

	useModalFocus(open, ctx.positionerRef, {
		initial() {
			const popup = popupRef.current;
			if (!popup) {
				return;
			}
			const selected = popup.querySelector<HTMLElement>(SELECTED_ITEM_SELECTOR) ?? undefined;

			let target: HTMLElement | undefined;
			if (ctx.openMethod === 'keyboard' && !selected) {
				const items = getListItems(popup);
				target = ctx.openEntry === 'last' ? items.at(-1) : items[0];
			} else if (ctx.openMethod !== 'touch') {
				target = selected;
			}
			(target ?? popup).focus({ preventScroll: true });
			(target ?? selected)?.scrollIntoView({ block: 'nearest' });
		},
		final() {
			triggerRef.current?.focus({ preventScroll: true });
		},
	});

	const navigationProps = getListNavigationProps({ loop: false, typeahead: ctx.typeahead });

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: ctx.popupId,
		role: 'listbox',
		'aria-labelledby': ctx.triggerId,
		...navigationProps,
		onKeyDown(event) {
			switch (event.key) {
				case 'Escape': {
					if (!isUnclaimedEscape(event.nativeEvent)) {
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
		tag: 'div',
		render,
		refs: [ref, popupRef],
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'div'>(getOpenAttributes(open), internalProps, elementProps),
	});
};
