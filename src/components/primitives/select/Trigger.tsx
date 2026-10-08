'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes, Ref } from 'react';

import { toInteractionType } from '#/lib/browser/input-modality';

import { useAnchorName } from '../anchored-popup';
import { dataAttributes } from '../data-attributes';
import { isTypeaheadKey } from '../list-navigation';
import { mergeProps } from '../merge-props';
import { getTriggerAttributes } from '../presence';
import { useListTriggerPress } from '../press-release';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type TriggerProps = Omit<RenderProps<'button'>, 'ref'> & {
	ref?: Ref<HTMLElement>;
};

/**
 * toggles the popup on press and opens it with Up/Down. dragging a mouse press onto an item selects it on
 * release; typing selects without opening. `data-placeholder` marks an empty selection.
 *
 * @param props element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = ({ render, ref, ...elementProps }: TriggerProps) => {
	const ctx = useRootContext();
	const { open, disabled, mounted, anchorName, setOpen, triggerRef } = ctx;

	const anchorRef = useAnchorName(mounted ? anchorName : undefined);

	const commitTypeahead = (key: string) => {
		const items = ctx.items;
		if (!items) {
			return false;
		}
		const labels = items.map((item) => item.label);
		const current = items.findIndex((item) => Object.is(item.value, ctx.value));
		const match = ctx.typeahead.match(key, labels, current);
		const item = items[match];
		if (!item) {
			return ctx.typeahead.active;
		}
		ctx.select(item.value);
		return true;
	};

	const pressProps = useListTriggerPress({
		open,
		positionerRef: ctx.positionerRef,
		onPress(_event, method) {
			setOpen(!open, { reason: 'trigger-press', method });
		},
		onArrowOpen(_event, entry) {
			setOpen(true, { reason: 'list-navigation', method: 'keyboard', entry });
		},
		onOutsideRelease(event) {
			setOpen(false, { reason: 'outside-press', method: toInteractionType(event.pointerType) });
		},
	});

	let interactionProps: HTMLAttributes<HTMLElement> | undefined;
	if (!disabled) {
		interactionProps = mergeProps<'button'>(pressProps, {
			onKeyDown(event) {
				if (!open && isTypeaheadKey(event) && commitTypeahead(event.key)) {
					// keep Space within a typed sequence from opening the popup.
					event.preventDefault();
				}
			},
		});
	}

	const ariaProps: HTMLAttributes<HTMLElement> = {
		id: ctx.triggerId,
		role: 'combobox',
		'aria-haspopup': 'listbox',
		'aria-expanded': open,
		'aria-controls': open ? ctx.popupId : undefined,
	};

	return useRender({
		tag: 'button',
		render,
		refs: [ref, triggerRef, anchorRef],
		props: mergeProps<'button'>(
			getTriggerAttributes(open),
			dataAttributes({ disabled, placeholder: ctx.placeholder }),
			{ type: 'button', disabled },
			ariaProps,
			// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
			interactionProps,
			elementProps,
		),
	});
};
