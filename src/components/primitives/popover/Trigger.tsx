'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type Ref, useLayoutEffect, useRef, useState } from 'react';

import { type InteractionType, isMouseLike, toInteractionType } from '#/lib/browser/input-modality';

import { addAnchorName } from '../anchored-popup';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { getTriggerAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { type Handle, type OpenChangeRequest, useTriggerRootContext } from './shared';

const OPEN_DELAY = 300;

export type TriggerProps = Omit<RenderProps<'button'>, 'ref'> & {
	ref?: Ref<HTMLElement>;
	/** handle shared with a detached `Root`. */
	handle?: Handle;
	/** enables hover opening with `delay` and `closeDelay`. */
	openOnHover?: boolean;
	/** hover delay before opening, in milliseconds. */
	delay?: number;
	/** hover delay before closing, in milliseconds; includes gap-crossing grace. */
	closeDelay?: number;
	/** prevents opening from this trigger. to disable the DOM element, pass `disabled` through `render`. */
	disabled?: boolean;
};

/**
 * toggles the popover on press, and optionally opens it on hover.
 *
 * @param props behavior and element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = ({
	render,
	ref,
	handle,
	openOnHover = false,
	delay = OPEN_DELAY,
	closeDelay = 0,
	disabled = false,
	...elementProps
}: TriggerProps) => {
	const ctx = useTriggerRootContext(handle);
	const [element, setElement] = useState<HTMLElement | null>(null);
	const pointerTypeRef = useRef<InteractionType>('');

	const active = element !== null && element === ctx?.activeTrigger;
	const open = !!ctx?.open && active;

	const claimTrigger = ctx?.claimTrigger;
	useLayoutEffect(() => {
		if (!claimTrigger || !element) {
			return;
		}
		return claimTrigger(element);
	}, [claimTrigger, element]);

	const anchorName = active && ctx.mounted ? ctx.anchorName : undefined;
	useLayoutEffect(() => {
		if (!element || anchorName === undefined) {
			return;
		}
		return addAnchorName(element, anchorName);
	}, [element, anchorName]);

	let ariaProps: HTMLAttributes<HTMLElement> = {};
	let pressProps: HTMLAttributes<HTMLElement> = {};
	let hoverProps: HTMLAttributes<HTMLElement> = {};
	if (ctx) {
		const { setOpen, timeout } = ctx;

		ariaProps = {
			'aria-haspopup': 'dialog',
			'aria-expanded': open,
			'aria-controls': open ? ctx.popupId : undefined,
		};

		if (!disabled) {
			pressProps = {
				onPointerDown(event) {
					pointerTypeRef.current = toInteractionType(event.pointerType);
				},
				onClick(event) {
					const method = event.detail === 0 ? 'keyboard' : pointerTypeRef.current || 'mouse';
					setOpen(!ctx.open, {
						reason: 'trigger-press',
						event: event.nativeEvent,
						trigger: event.currentTarget,
						method,
					});
				},
			};
		}

		if (!disabled && openOnHover) {
			hoverProps = {
				onPointerEnter(event) {
					if (!isMouseLike(event)) {
						return;
					}
					if (ctx.open) {
						timeout.clear();
						return;
					}

					const request: OpenChangeRequest = {
						reason: 'trigger-hover',
						event: event.nativeEvent,
						trigger: event.currentTarget,
						hoverCloseDelay: closeDelay,
					};
					if (delay === 0) {
						setOpen(true, request);
					} else {
						timeout.start(delay, () => setOpen(true, request));
					}
				},
				onPointerLeave(event) {
					if (!isMouseLike(event)) {
						return;
					}
					if (!ctx.open) {
						timeout.clear();
						return;
					}
					if (ctx.openReason === 'trigger-hover') {
						ctx.startHoverClose(event.nativeEvent);
					}
				},
			};
		}
	}

	return useRender({
		tag: 'button',
		render,
		refs: [ref, setElement],
		props: mergeProps<'button'>(
			getTriggerAttributes(open),
			dataAttributes({ disabled }),
			ariaProps,
			// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
			pressProps,
			hoverProps,
			elementProps,
		),
	});
};
