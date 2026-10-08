'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useRef } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';

import { getNextTabbable } from '../focus';
import { createTypeahead, getListItems, getListNavigationProps } from '../list-navigation';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { isUnclaimedEscape, useModalFocus } from '../top-layer';
import { useRootContext } from './shared';

export type PopupProps = RenderProps<'div'>;

/**
 * renders a menu. keyboard opens focus the first or last item; other opens focus the menu. closing restores
 * trigger focus unless focus moved elsewhere. Tab moves past the trigger; Shift+Tab returns to it.
 *
 * @param props element props; an `aria-label` replaces the trigger as the menu's name
 * @returns the menu element; a `<div>` by default
 */
export const Popup = ({ render, ref, ...elementProps }: PopupProps) => {
	const ctx = useRootContext();
	const { open, setOpen } = ctx;
	const popupRef = useRef<HTMLDivElement | null>(null);
	const typeahead = useConstant(createTypeahead);
	const tabbedOutRef = useRef(false);

	useModalFocus(open, ctx.positionerRef, {
		initial() {
			tabbedOutRef.current = false;
			const popup = popupRef.current;
			if (!popup) {
				return;
			}
			if (ctx.openEntry !== null) {
				const items = getListItems(popup);
				const entry = ctx.openEntry === 'first' ? items[0] : items.at(-1);
				if (entry) {
					entry.focus();
					return;
				}
			}
			popup.focus({ preventScroll: true });
		},
		final() {
			const trigger = ctx.activeTrigger;
			if (!trigger) {
				return;
			}
			const next = tabbedOutRef.current ? getNextTabbable(trigger, ctx.positionerRef.current) : undefined;
			if (next) {
				next.focus();
			} else {
				trigger.focus({ preventScroll: true });
			}
		},
	});

	const navigationProps = getListNavigationProps({ loop: true, typeahead });

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: ctx.popupId,
		role: 'menu',
		'aria-labelledby':
			elementProps['aria-label'] === undefined ? (ctx.activeTriggerId ?? undefined) : undefined,
		...navigationProps,
		onKeyDown(event) {
			switch (event.key) {
				case 'Escape': {
					if (!isUnclaimedEscape(event.nativeEvent)) {
						return;
					}
					// prevent Escape from also closing an enclosing dialog.
					event.preventDefault();
					setOpen(false, { reason: 'escape-key', event: event.nativeEvent });
					return;
				}
				case 'Tab': {
					// close before moving focus; a modal menu leaves nothing else tabbable.
					event.preventDefault();
					tabbedOutRef.current = !event.shiftKey;
					setOpen(false, { reason: 'focus-out', event: event.nativeEvent });
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
