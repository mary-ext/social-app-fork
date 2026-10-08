'use no memo';

import { type HTMLAttributes, type Ref, useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { isMouseLike } from '#/lib/browser/input-modality';

import { addAnchorName } from '../anchored-popup';
import { triggerStateAttributes } from '../presence';
import { type OpenChangeReason, useRootContext } from './shared';

const OPEN_DELAY = 600;
const CLOSE_DELAY = 300;

export type TriggerState = {
	open: boolean;
};

export type TriggerProps = Omit<useRender.ComponentProps<'a', TriggerState>, 'ref'> & {
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

	useLayoutEffect(() => {
		const el = triggerRef.current;
		if (!mounted || !el) {
			return;
		}
		return addAnchorName(el, anchorName);
	}, [mounted, triggerRef, anchorName]);

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
		render,
		defaultTagName: 'a',
		ref: [ref ?? null, triggerRef],
		state: { open },
		stateAttributesMapping: triggerStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'a'>(internalProps, elementProps),
	});
};
