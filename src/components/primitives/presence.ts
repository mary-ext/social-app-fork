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
 */
export const useTransitionsSettled = (
	ref: RefObject<HTMLElement | null>,
	open: boolean,
	onSettled: (open: boolean) => void,
): void => {
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		let stale = false;
		const frame = requestAnimationFrame(() => {
			// looping animations must not block unmounting.
			const animations = el
				.getAnimations({ subtree: true })
				.filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);
			Promise.all(animations.map((animation) => animation.finished)).then(
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
		};
	}, [open, ref, onSettled]);
};

export const openStateAttributes = {
	open: (open: boolean): Record<string, string> => (open ? { 'data-open': '' } : { 'data-closed': '' }),
};

export const triggerStateAttributes = {
	open: (open: boolean): Record<string, string> | null => (open ? { 'data-popup-open': '' } : null),
};
