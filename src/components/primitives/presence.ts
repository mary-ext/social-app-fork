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

		// recheck after cancellation to catch replacement transitions, such as a mid-exit media query change.
		const waitForAnimations = (): void => {
			if (stale) {
				return;
			}
			// ignore infinite and scroll-driven animations. finished animations with fill remain in the list;
			// waiting on them again would loop.
			const pending = el
				.getAnimations({ subtree: true })
				.filter(
					(animation) =>
						animation.timeline === document.timeline &&
						animation.playState !== 'finished' &&
						animation.effect?.getComputedTiming().endTime !== Infinity,
				)
				.map((animation) => animation.finished);
			if (pending.length === 0) {
				onSettled(open);
				return;
			}
			Promise.all(pending).then(waitForAnimations, waitForAnimations);
		};

		const frame = requestAnimationFrame(() => {
			if (untrackedPseudoElement === undefined) {
				waitForAnimations();
				return;
			}
			// `getAnimations()` may omit pseudo-element transitions, notably `::details-content`.
			const delay = getTransitionTime(getComputedStyle(el, untrackedPseudoElement));
			timeout = setTimeout(waitForAnimations, delay);
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
