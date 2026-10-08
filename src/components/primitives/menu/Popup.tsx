'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useEffect, useLayoutEffect, useRef } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { getNextTabbable } from '../focus';
import { createTypeahead, getListItems, getListNavigationProps } from '../list-navigation';
import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { leaveModal } from '../top-layer';
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

	const focusInitial = useNonReactiveCallback(() => {
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
	});

	const focusFinal = useNonReactiveCallback(() => {
		const trigger = ctx.activeTrigger;
		const focusedInside = leaveModal(ctx.positionerRef.current);
		// preserve focus moved outside by the user, or by an item opening a dialog.
		if (!trigger || !focusedInside) {
			return;
		}
		if (tabbedOutRef.current) {
			const next = getNextTabbable(trigger, ctx.positionerRef.current);
			if (next) {
				next.focus();
				return;
			}
		}
		trigger.focus({ preventScroll: true });
	});

	// focus after the positioner enters the top layer.
	useEffect(() => {
		if (open) {
			tabbedOutRef.current = false;
			focusInitial();
		}
	}, [open, focusInitial]);

	useLayoutEffect(() => {
		if (!open) {
			focusFinal();
		}
	}, [open, focusFinal]);

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
					if (event.nativeEvent.isComposing) {
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
