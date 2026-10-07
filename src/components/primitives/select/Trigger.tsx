'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useLayoutEffect, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type InteractionType, toInteractionType } from '#/lib/browser/input-modality';

import { addAnchorName, triggerStateAttributes } from '../anchored-popup';
import { isTypeaheadKey } from '../list-navigation';
import { listenForRelease } from '../press-release';
import { useRootContext } from './shared';

export type TriggerState = {
	open: boolean;
	disabled: boolean;
	/** whether no value is selected. */
	placeholder: boolean;
};

export type TriggerProps = Omit<useRender.ComponentProps<'button', TriggerState>, 'ref'> & {
	ref?: Ref<HTMLElement>;
};

/**
 * toggles the popup on press and opens it with Up/Down. dragging a mouse press onto an item selects it on
 * release; typing selects without opening.
 *
 * @param props element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = ({ render, ref, ...elementProps }: TriggerProps) => {
	const ctx = useRootContext();
	const { open, disabled, mounted, anchorName, setOpen, triggerRef } = ctx;
	const pointerTypeRef = useRef<InteractionType>('');

	useLayoutEffect(() => {
		const el = triggerRef.current;
		if (!el || !mounted) {
			return;
		}
		return addAnchorName(el, anchorName);
	}, [mounted, anchorName, triggerRef]);

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

	let interactionProps: HTMLAttributes<HTMLElement> = {};
	if (!disabled) {
		interactionProps = {
			onPointerDown(event) {
				pointerTypeRef.current = toInteractionType(event.pointerType);
			},
			onMouseDown(event) {
				if (event.button !== 0 || pointerTypeRef.current === 'touch') {
					return;
				}
				// keep native mousedown focus from competing with popup focus.
				event.preventDefault();
				const method = pointerTypeRef.current || 'mouse';
				setOpen(!open, { reason: 'trigger-press', method });
				if (!open) {
					listenForRelease(event.nativeEvent, {
						trigger: event.currentTarget,
						positionerRef: ctx.positionerRef,
						onOutsideRelease(release) {
							setOpen(false, { reason: 'outside-press', method: toInteractionType(release.pointerType) });
						},
					});
				}
			},
			onClick(event) {
				// mouse presses toggle on mousedown.
				if (event.detail !== 0 && pointerTypeRef.current !== 'touch') {
					return;
				}
				const method = event.detail === 0 ? 'keyboard' : 'touch';
				setOpen(!open, { reason: 'trigger-press', method });
			},
			onKeyDown(event) {
				if (open) {
					return;
				}
				switch (event.key) {
					case 'ArrowDown':
					case 'ArrowUp': {
						event.preventDefault();
						setOpen(true, {
							reason: 'list-navigation',
							method: 'keyboard',
							entry: event.key === 'ArrowDown' ? 'first' : 'last',
						});
						return;
					}
				}
				if (isTypeaheadKey(event) && commitTypeahead(event.key)) {
					// keep Space within a typed sequence from opening the popup.
					event.preventDefault();
				}
			},
		};
	}

	const ariaProps: HTMLAttributes<HTMLElement> = {
		id: ctx.triggerId,
		role: 'combobox',
		'aria-haspopup': 'listbox',
		'aria-expanded': open,
		'aria-controls': open ? ctx.popupId : undefined,
	};

	return useRender({
		render,
		defaultTagName: 'button',
		ref: [ref ?? null, triggerRef],
		state: { open, disabled, placeholder: ctx.placeholder },
		stateAttributesMapping: triggerStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'button'>({ type: 'button', disabled }, ariaProps, interactionProps, elementProps),
	});
};
