'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useId, useLayoutEffect, useRef } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type InteractionType, toInteractionType } from '#/lib/browser/input-modality';

import { addAnchorName } from '../anchored-popup';
import { triggerStateAttributes } from '../presence';
import { listenForRelease } from '../press-release';
import { type Handle, type RootContextValue, useTriggerRootContext } from './shared';

export type TriggerState = {
	/** whether the menu is open and anchored to this trigger. */
	open: boolean;
	disabled: boolean;
};

export type TriggerProps = Omit<useRender.ComponentProps<'button', TriggerState>, 'ref'> & {
	ref?: Ref<HTMLElement>;
	/** handle shared with a detached `Root`. */
	handle?: Handle;
	/** prevents opening from this trigger. to disable the DOM element, pass `disabled` through `render`. */
	disabled?: boolean;
};

/**
 * opens on mousedown or Up/Down, with drag-to-select. touch and draggable triggers open on click.
 *
 * @param props behavior and element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = ({
	render,
	ref,
	id: idProp,
	handle,
	disabled = false,
	...elementProps
}: TriggerProps) => {
	const ctx = useTriggerRootContext(handle);
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const elementRef = useRef<HTMLElement | null>(null);
	const pointerTypeRef = useRef<InteractionType>('');
	const pressToggledRef = useRef(false);

	const active = ctx?.activeTriggerId === id;
	const open = !!ctx?.open && active;

	const registerTrigger = ctx?.registerTrigger;
	useLayoutEffect(() => {
		const el = elementRef.current;
		if (!registerTrigger || !el) {
			return;
		}
		return registerTrigger(id, el);
	}, [registerTrigger, id]);

	const anchorName = active && ctx.mounted ? ctx.anchorName : undefined;
	useLayoutEffect(() => {
		const el = elementRef.current;
		if (!el || anchorName === undefined) {
			return;
		}
		return addAnchorName(el, anchorName);
	}, [anchorName]);

	const ariaProps: HTMLAttributes<HTMLElement> = ctx
		? {
				'aria-haspopup': 'menu',
				'aria-expanded': open,
				'aria-controls': open ? ctx.popupId : undefined,
			}
		: {};

	return useRender({
		render,
		defaultTagName: 'button',
		ref: [ref ?? null, elementRef],
		state: { open, disabled },
		stateAttributesMapping: triggerStateAttributes,
		props: mergeProps<'button'>(
			{ id, type: render === undefined ? 'button' : undefined },
			ariaProps,
			// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
			ctx && !disabled ? getPressProps(ctx, id, pointerTypeRef, pressToggledRef) : undefined,
			elementProps,
		),
	});
};

const getPressProps = (
	ctx: RootContextValue,
	id: string,
	pointerTypeRef: { current: InteractionType },
	pressToggledRef: { current: boolean },
): HTMLAttributes<HTMLElement> => {
	const { setOpen } = ctx;

	return {
		onPointerDown(event) {
			pointerTypeRef.current = toInteractionType(event.pointerType);
			pressToggledRef.current = false;
		},
		onMouseDown(event) {
			if (event.button !== 0 || pointerTypeRef.current === 'touch') {
				return;
			}
			// preventing mousedown would cancel a native drag, so draggable triggers open on click.
			if (event.currentTarget.closest('[draggable="true"]')) {
				return;
			}
			// keep native mousedown focus from competing with popup focus.
			event.preventDefault();
			pressToggledRef.current = true;

			setOpen(!ctx.open, { reason: 'trigger-press', event: event.nativeEvent, triggerId: id });
			if (!ctx.open) {
				listenForRelease(event.nativeEvent, {
					trigger: event.currentTarget,
					positionerRef: ctx.positionerRef,
					onOutsideRelease(release) {
						setOpen(false, { reason: 'outside-press', event: release });
					},
				});
			}
		},
		onClick(event) {
			// keyboard activation dispatches a click without a press.
			const keyboard = event.detail === 0;
			// mousedown already toggled the menu.
			if (!keyboard && pressToggledRef.current) {
				pressToggledRef.current = false;
				return;
			}
			setOpen(!ctx.open, {
				reason: 'trigger-press',
				event: event.nativeEvent,
				triggerId: id,
				entry: keyboard ? 'first' : undefined,
			});
		},
		onKeyDown(event) {
			if (ctx.open) {
				return;
			}
			switch (event.key) {
				case 'ArrowDown':
				case 'ArrowUp': {
					event.preventDefault();
					setOpen(true, {
						reason: 'list-navigation',
						event: event.nativeEvent,
						triggerId: id,
						entry: event.key === 'ArrowDown' ? 'first' : 'last',
					});
					return;
				}
				case ' ': {
					// buttons activate on Space natively; other elements, like links, do not.
					if (event.currentTarget instanceof HTMLButtonElement) {
						return;
					}
					event.preventDefault();
					setOpen(true, { reason: 'trigger-press', event: event.nativeEvent, triggerId: id, entry: 'first' });
					return;
				}
			}
		},
	};
};
