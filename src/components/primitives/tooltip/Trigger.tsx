'use no memo'; // composition props usually invalidate the generated wrapper caches

import {
	type HTMLAttributes,
	type MouseEvent,
	type PointerEvent,
	type Ref,
	useLayoutEffect,
	useRef,
} from 'react';

import { isMouseLike } from '#/lib/browser/input-modality';

import { addAnchorName, HOVERABLE_GRACE } from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { getTriggerAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

const OPEN_DELAY = 600;

export type TriggerProps = Omit<RenderProps<'button'>, 'ref'> & {
	ref?: Ref<HTMLElement>;
	/** pointer rest time before opening, in milliseconds. */
	delay?: number;
	/** delay after pointer leave, in milliseconds. hoverable popups allow extra time to cross the gap. */
	closeDelay?: number;
	/** closes on pointer or keyboard activation. */
	closeOnClick?: boolean;
	/** prevents opening from this trigger. to disable the DOM element, pass `disabled` through `render`. */
	disabled?: boolean;
};

/**
 * opens the tooltip on hover or keyboard focus.
 *
 * @param props timing and element props
 * @returns the trigger element; a `<button>` by default
 */
export const Trigger = ({
	render,
	ref,
	delay = OPEN_DELAY,
	closeDelay = 0,
	closeOnClick = true,
	disabled: disabledProp,
	...elementProps
}: TriggerProps) => {
	const { open, mounted, blockedRef, triggerRef, positionerRef, anchorName, setOpen, timeout, ...ctx } =
		useRootContext();
	const disabled = disabledProp ?? ctx.disabled;

	const lastMoveRef = useRef(0);

	useLayoutEffect(() => {
		const el = triggerRef.current;
		if (!mounted || !el) {
			return;
		}
		return addAnchorName(el, anchorName);
	}, [mounted, triggerRef, anchorName]);

	// check the last movement when the timer fires to avoid restarting it on every move.
	const rest = (event: PointerEvent) => {
		lastMoveRef.current = event.timeStamp;
		if (timeout.isStarted()) {
			return;
		}

		const check = () => {
			const remaining = delay - (performance.now() - lastMoveRef.current);
			if (remaining > 0) {
				timeout.start(remaining, check);
			} else {
				setOpen(true, 'trigger-hover', event.nativeEvent);
			}
		};
		timeout.start(delay, check);
	};

	const press = (event: MouseEvent) => {
		if (closeOnClick) {
			blockedRef.current = true;
			setOpen(false, 'trigger-press', event.nativeEvent);
		}
	};

	let internalProps: HTMLAttributes<HTMLElement> = {};
	if (!disabled) {
		internalProps = {
			onPointerEnter(event) {
				if (!isMouseLike(event) || blockedRef.current) {
					return;
				}
				if (open) {
					timeout.clear();
					return;
				}
				rest(event);
			},
			onPointerMove(event) {
				if (!isMouseLike(event) || blockedRef.current || open) {
					return;
				}
				// ignore pointer jitter when measuring rest time.
				if (event.movementX ** 2 + event.movementY ** 2 < 2) {
					return;
				}
				rest(event);
			},
			onPointerLeave(event) {
				blockedRef.current = false;
				if (!isMouseLike(event)) {
					return;
				}
				if (!open) {
					timeout.clear();
					return;
				}

				const ms = ctx.disableHoverablePopup ? closeDelay : Math.max(closeDelay, HOVERABLE_GRACE);
				if (ms === 0) {
					setOpen(false, 'trigger-hover', event.nativeEvent);
				} else {
					timeout.start(ms, () => setOpen(false, 'trigger-hover', event.nativeEvent));
				}
			},
			// pointerdown dismisses immediately; click also covers keyboard activation.
			onPointerDown: press,
			onClick: press,
			onFocus(event) {
				if (blockedRef.current || !event.target.matches(':focus-visible')) {
					return;
				}
				setOpen(true, 'trigger-focus', event.nativeEvent);
			},
			onBlur(event) {
				blockedRef.current = false;

				const next = event.relatedTarget;
				const trigger = event.currentTarget;

				// preserve the tooltip while the window is unfocused.
				if (next === null && document.activeElement === trigger) {
					return;
				}
				if (next !== null && (trigger.contains(next) || positionerRef.current?.contains(next))) {
					return;
				}
				setOpen(false, 'trigger-focus', event.nativeEvent);
			},
		};
	}

	return useRender({
		tag: 'button',
		render,
		refs: [ref, triggerRef],
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'button'>(getTriggerAttributes(open), internalProps, elementProps),
	});
};
