'use no memo';

import type { HTMLAttributes, Ref } from 'react';

import { isMouseLike } from '#/lib/browser/input-modality';

import { useAnchorName } from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { getTriggerAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { type OpenChangeReason, useRootContext } from './shared';

const OPEN_DELAY = 600;
const CLOSE_DELAY = 300;

export type TriggerProps = Omit<RenderProps<'a'>, 'ref'> & {
	ref?: Ref<HTMLElement>;
	/** delay before opening on hover or keyboard focus, in milliseconds. */
	delay?: number;
	/** delay after leaving the trigger or card, in milliseconds; allows a minimum gap-crossing grace period. */
	closeDelay?: number;
};

/**
 * opens the preview card on mouse hover or keyboard focus.
 *
 * @param props timing and element props
 * @returns the trigger element; an `<a>` by default
 */
export const Trigger = ({
	render,
	ref,
	delay = OPEN_DELAY,
	closeDelay = CLOSE_DELAY,
	...elementProps
}: TriggerProps) => {
	const {
		open,
		mounted,
		anchorName,
		blockedRef,
		closeDelayRef,
		triggerRef,
		positionerRef,
		setOpen,
		startHoverClose,
		timeout,
	} = useRootContext();

	const anchorRef = useAnchorName(mounted ? anchorName : undefined);

	const scheduleOpen = (reason: OpenChangeReason, event: Event) => {
		if (open) {
			timeout.clear();
		} else {
			timeout.start(delay, () => setOpen(true, reason, event));
		}
	};

	const internalProps: HTMLAttributes<HTMLElement> = {
		onPointerEnter(event) {
			if (!isMouseLike(event)) {
				return;
			}
			closeDelayRef.current = closeDelay;
			scheduleOpen('trigger-hover', event.nativeEvent);
		},
		onPointerLeave(event) {
			blockedRef.current = false;
			if (!isMouseLike(event)) {
				return;
			}
			if (open) {
				startHoverClose(event.nativeEvent);
			} else {
				timeout.clear();
			}
		},
		onFocus(event) {
			if (blockedRef.current || !event.target.matches(':focus-visible')) {
				return;
			}
			scheduleOpen('trigger-focus', event.nativeEvent);
		},
		onBlur(event) {
			blockedRef.current = false;

			const next = event.relatedTarget;
			const trigger = event.currentTarget;

			// window blur leaves the trigger focused; keep the card open.
			if (next === null && document.activeElement === trigger) {
				return;
			}
			if (next !== null && (trigger.contains(next) || positionerRef.current?.contains(next))) {
				return;
			}
			if (open) {
				setOpen(false, 'trigger-focus', event.nativeEvent);
			} else if (!trigger.matches(':hover')) {
				// cancel a pending focus open, but not a hover open.
				timeout.clear();
			}
		},
	};

	return useRender({
		tag: 'a',
		render,
		refs: [ref, triggerRef, anchorRef],
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'a'>(getTriggerAttributes(open), internalProps, elementProps),
	});
};
