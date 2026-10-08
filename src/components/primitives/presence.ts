import { type RefObject, useLayoutEffect, useState } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

/**
 * keeps a popup mounted until its exit transitions finish.
 *
 * @param open current open state
 * @param onOpenChangeComplete receives the open state once its transitions finish
 * @returns whether the popup is mounted, and the callback to pass to {@link useTransitionsSettled}
 */
export const usePresence = (
	open: boolean,
	onOpenChangeComplete: ((open: boolean) => void) | undefined,
): { mounted: boolean; onTransitionSettled: (open: boolean) => void } => {
	const [present, setPresent] = useState(open);
	if (open && !present) {
		setPresent(true);
	}

	const onTransitionSettled = useNonReactiveCallback((settledOpen: boolean) => {
		if (!settledOpen) {
			setPresent(false);
		}
		onOpenChangeComplete?.(settledOpen);
	});

	return { mounted: open || present, onTransitionSettled };
};

/**
 * prevents focus and input during exit transitions. restore focus in an earlier layout effect.
 *
 * @param ref popup positioning element
 * @param open current open state
 */
export const useInertWhileClosed = (ref: RefObject<HTMLElement | null>, open: boolean): void => {
	useLayoutEffect(() => {
		const el = ref.current;
		if (el) {
			el.inert = !open;
		}
	}, [open, ref]);
};

/**
 * reports completed open/close transitions of a mounted popup.
 *
 * @param ref the popup's positioning element
 * @param open current open state
 * @param onSettled receives the open state once its transitions finish
 * @param untrackedPseudoElement pseudo-element whose computed transition timing must also elapse
 */
export const useTransitionsSettled = (
	ref: RefObject<HTMLElement | null>,
	open: boolean,
	onSettled: (open: boolean) => void,
	untrackedPseudoElement?: string,
): void => {
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		let stale = false;
		let timeout: ReturnType<typeof setTimeout> | undefined;
		const frame = requestAnimationFrame(() => {
			const pending: Promise<unknown>[] = [];
			if (untrackedPseudoElement !== undefined) {
				// `getAnimations()` may omit pseudo-element transitions, notably `::details-content`.
				const delay = getTransitionTime(getComputedStyle(el, untrackedPseudoElement));
				pending.push(new Promise((resolve) => (timeout = setTimeout(resolve, delay))));
			}
			// looping animations must not block unmounting.
			for (const animation of el.getAnimations({ subtree: true })) {
				if (animation.effect?.getComputedTiming().endTime !== Infinity) {
					pending.push(animation.finished);
				}
			}
			Promise.all(pending).then(
				() => {
					if (!stale) {
						onSettled(open);
					}
				},
				() => {
					// native dismissal cancels exit animations without replacement transitions to wait for.
					if (!stale && !open && !el.matches(':popover-open')) {
						onSettled(open);
					}
				},
			);
		});

		return () => {
			stale = true;
			cancelAnimationFrame(frame);
			clearTimeout(timeout);
		};
	}, [open, ref, onSettled, untrackedPseudoElement]);
};

/** @returns the longest transition duration plus delay, in milliseconds */
const getTransitionTime = (style: CSSStyleDeclaration): number => {
	const durations = parseTimes(style.transitionDuration);
	const delays = parseTimes(style.transitionDelay);

	// CSS repeats shorter timing lists.
	let max = 0;
	for (let i = 0, n = Math.max(durations.length, delays.length); i < n; i++) {
		max = Math.max(max, durations[i % durations.length]! + delays[i % delays.length]!);
	}
	return max;
};

const parseTimes = (list: string): number[] => {
	return list.split(',').map((value) => {
		const time = parseFloat(value);
		return value.trim().endsWith('ms') ? time : time * 1000;
	});
};

export const openStateAttributes = {
	open: (open: boolean): Record<string, string> => (open ? { 'data-open': '' } : { 'data-closed': '' }),
};

export const triggerStateAttributes = {
	open: (open: boolean): Record<string, string> | null => (open ? { 'data-popup-open': '' } : null),
};
