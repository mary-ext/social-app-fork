'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useId, useLayoutEffect, useRef } from 'react';

import { useAnchorName } from '../anchored-popup';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { getTriggerAttributes } from '../presence';
import { useListTriggerPress } from '../press-release';
import { type RenderProps, useRender } from '../render';
import { type Handle, useTriggerRootContext } from './shared';

export type TriggerProps = Omit<RenderProps<'button'>, 'ref'> & {
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

	const active = ctx?.activeTriggerId === id;
	const open = !!ctx?.open && active;

	// use an effect: ref reattachment would reorder fallback triggers.
	const registerTrigger = ctx?.registerTrigger;
	useLayoutEffect(() => {
		const el = elementRef.current;
		if (!registerTrigger || !el) {
			return;
		}
		return registerTrigger(id, el);
	}, [registerTrigger, id]);
	const anchorRef = useAnchorName(active && ctx.mounted ? ctx.anchorName : undefined);

	const pressProps = useListTriggerPress({
		open: !!ctx?.open,
		positionerRef: ctx?.positionerRef,
		onPress(event, method) {
			ctx?.setOpen(!ctx.open, {
				reason: 'trigger-press',
				event,
				triggerId: id,
				entry: method === 'keyboard' ? 'first' : undefined,
			});
		},
		onArrowOpen(event, entry) {
			ctx?.setOpen(true, { reason: 'list-navigation', event, triggerId: id, entry });
		},
		onOutsideRelease(event) {
			ctx?.setOpen(false, { reason: 'outside-press', event });
		},
	});

	let interactionProps: HTMLAttributes<HTMLElement> | undefined;
	if (ctx && !disabled) {
		interactionProps = mergeProps<'button'>(pressProps, {
			onKeyDown(event) {
				// buttons activate on Space natively; other elements, like links, do not.
				if (ctx.open || event.key !== ' ' || event.currentTarget instanceof HTMLButtonElement) {
					return;
				}
				event.preventDefault();
				ctx.setOpen(true, {
					reason: 'trigger-press',
					event: event.nativeEvent,
					triggerId: id,
					entry: 'first',
				});
			},
		});
	}

	const ariaProps: HTMLAttributes<HTMLElement> = ctx
		? {
				'aria-haspopup': 'menu',
				'aria-expanded': open,
				'aria-controls': open ? ctx.popupId : undefined,
			}
		: {};

	return useRender({
		tag: 'button',
		render,
		refs: [ref, elementRef, anchorRef],
		props: mergeProps<'button'>(
			getTriggerAttributes(open),
			dataAttributes({ disabled }),
			{ id },
			ariaProps,
			// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
			interactionProps,
			elementProps,
		),
	});
};
