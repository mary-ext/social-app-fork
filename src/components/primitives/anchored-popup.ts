import './position-try.css';

import {
	type CSSProperties,
	type DialogHTMLAttributes,
	type HTMLAttributes,
	type RefObject,
	useLayoutEffect,
	useState,
} from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

export type Side = 'bottom' | 'left' | 'right' | 'top';
export type Align = 'center' | 'end' | 'start';

/** minimum distance from the viewport edges, in pixels; one number applies to every side. */
export type CollisionPadding = number | Partial<Record<Side, number>>;

/**
 * @param padding uniform or per-edge padding
 * @param edge viewport edge
 * @returns edge padding, or `undefined` for an unset edge
 */
const resolveCollisionPadding = (padding: CollisionPadding, edge: Side): number | undefined => {
	return typeof padding === 'number' ? padding : padding[edge];
};

const isVertical = (side: Side): boolean => {
	return side === 'top' || side === 'bottom';
};

const getPositionArea = (side: Side, align: Align): string => {
	// a single side keyword permits shifting near viewport edges; spans align to the anchor's edges.
	switch (align) {
		case 'center': {
			return side;
		}
		case 'start': {
			return isVertical(side) ? `${side} span-x-end` : `${side} span-y-end`;
		}
		case 'end': {
			return isVertical(side) ? `${side} span-x-start` : `${side} span-y-start`;
		}
	}
};

const OPPOSITE = {
	bottom: 'top',
	left: 'right',
	right: 'left',
	top: 'bottom',
} as const;

const MARGIN = {
	bottom: 'marginBottom',
	left: 'marginLeft',
	right: 'marginRight',
	top: 'marginTop',
} as const;

/**
 * anchors a popup with side-flip fallbacks and viewport clearance.
 *
 * @param options anchor name and placement
 * @returns styles for the positioning element
 */
export const getAnchoredStyle = ({
	anchorName,
	side,
	align,
	sideOffset,
	collisionPadding,
}: {
	anchorName: string;
	side: Side;
	align: Align;
	sideOffset: number;
	collisionPadding: CollisionPadding;
}): CSSProperties => {
	const style: CSSProperties = {
		positionAnchor: anchorName,
		positionArea: getPositionArea(side, align),
		positionTryFallbacks: isVertical(side) ? 'flip-block' : 'flip-inline',
		[MARGIN[OPPOSITE[side]]]: sideOffset,
	};

	const [start, end]: [Side, Side] = isVertical(side) ? ['left', 'right'] : ['top', 'bottom'];
	const edges: Side[] = [side];
	// padding the anchor-aligned edge would shift the alignment.
	if (align !== 'end') {
		edges.push(end);
	}
	if (align !== 'start') {
		edges.push(start);
	}
	// margins provide collision padding and flip with the placement.
	for (const edge of edges) {
		const value = resolveCollisionPadding(collisionPadding, edge);
		if (value !== undefined) {
			style[MARGIN[edge]] = value;
		}
	}

	return style;
};

/**
 * anchors a popup above or below, flipping or shrinking to fit the viewport. use with `shrinkingPositioner`
 * and scrollable popup content.
 *
 * @param options anchor name and placement
 * @returns styles for the positioning element
 */
export const getShrinkingAnchoredStyle = (
	options: Parameters<typeof getAnchoredStyle>[0] & { side: 'bottom' | 'top' },
): CSSProperties => {
	const margins = options.sideOffset + (resolveCollisionPadding(options.collisionPadding, options.side) ?? 0);
	return {
		...getAnchoredStyle(options),
		positionTryFallbacks:
			'flip-block, --anchored-shrink-floored, --anchored-shrink-floored flip-block, --anchored-shrink',
		'--anchored-block-margins': `${margins}px`,
	};
};

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
 * shows an open popover in the top layer. leaves it shown on close for exit transitions before unmounting.
 *
 * @param open current open state
 * @param source invoking element for native Tab order; applied when shown
 * @returns a ref callback for the popover element
 */
export const showInTopLayer = (open: boolean, source?: HTMLElement | null) => {
	return (el: HTMLElement | null): void => {
		if (open && el && !el.matches(':popover-open')) {
			el.showPopover({ source: source ?? undefined });
		}
	};
};

/**
 * shows an open popup as a modal dialog. pair with {@link getDialogProps}.
 *
 * @param open current open state
 * @returns a ref callback for the dialog element
 */
export const showModalInTopLayer = (open: boolean) => {
	return (el: HTMLDialogElement | null): void => {
		if (!open || !el || el.open) {
			return;
		}
		// reopening during an exit transition.
		if (el.matches(':popover-open')) {
			el.hidePopover();
		}
		el.showModal();
	};
};

/**
 * ends modality and keeps the popup in the top layer for exit transitions. call in a close layout effect
 * before restoring focus; closing the dialog may restore pre-open focus natively.
 *
 * @param el popup positioning dialog, or `null`
 * @returns whether focus was in the popup or on the body before closing
 */
export const leaveModal = (el: HTMLDialogElement | null): boolean => {
	const active = document.activeElement;
	const focused = active === document.body || !!el?.contains(active);
	if (el?.open) {
		el.close();
		el.showPopover();
	}
	return focused;
};

/**
 * routes native dialog dismissal through the popup's close handler.
 *
 * @param open current open state
 * @param requestClose receives the native event; returns whether dismissal was accepted
 * @returns props for the dialog element
 */
export const getDialogProps = (
	open: boolean,
	requestClose: (event: Event) => boolean,
): Pick<DialogHTMLAttributes<HTMLDialogElement>, 'onCancel' | 'onClose' | 'popover' | 'role'> => {
	return {
		popover: 'manual',
		role: 'presentation',
		onCancel(event) {
			event.preventDefault();
			requestClose(event.nativeEvent);
		},
		onClose(event) {
			const el = event.currentTarget;
			if (!open || el.open || el.matches(':popover-open')) {
				return;
			}
			// without intervening user activation, close requests can skip `cancel`; reopen if rejected.
			if (!requestClose(event.nativeEvent)) {
				el.showModal();
			}
		},
	};
};

/**
 * configures a hint popover: replaces other hints, leaves auto popovers open.
 *
 * @param requestClose receives the native event when the browser closes the hint
 * @returns props for the popover element
 */
export const getHintProps = (
	requestClose: (event: Event) => void,
): Pick<HTMLAttributes<HTMLElement>, 'onToggle' | 'popover'> => {
	return {
		// browsers without hint support treat it as manual.
		popover: 'hint',
		onToggle(event) {
			if (event.newState === 'closed') {
				requestClose(event.nativeEvent);
			}
		},
	};
};

/**
 * @param positioner popup positioning element
 * @param target event target
 * @returns whether the target is a descendant of the positioner
 */
export const isWithinPopup = (positioner: HTMLElement | null, target: EventTarget | null): boolean => {
	// backdrop presses target the positioner itself.
	return target instanceof Node && target !== positioner && !!positioner?.contains(target);
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

const anchorNames = new WeakMap<HTMLElement, string[]>();

// custom triggers may replace inline styles, so write anchor names directly.
const writeAnchorNames = (el: HTMLElement, names: string[]): void => {
	if (names.length === 0) {
		anchorNames.delete(el);
		el.style.removeProperty('anchor-name');
	} else {
		anchorNames.set(el, names);
		el.style.setProperty('anchor-name', names.join(', '));
	}
};

/**
 * registers an anchor name without replacing other popups' names.
 *
 * @param el element to anchor to
 * @param name dashed anchor name
 * @returns a function that removes the name
 */
export const addAnchorName = (el: HTMLElement, name: string): (() => void) => {
	writeAnchorNames(el, [...(anchorNames.get(el) ?? []), name]);
	return () => {
		writeAnchorNames(
			el,
			(anchorNames.get(el) ?? []).filter((other) => other !== name),
		);
	};
};

/** minimum gap-crossing time for hoverable popups, in milliseconds. */
export const HOVERABLE_GRACE = 100;

export const openStateAttributes = {
	open: (open: boolean): Record<string, string> => (open ? { 'data-open': '' } : { 'data-closed': '' }),
};

export const triggerStateAttributes = {
	open: (open: boolean): Record<string, string> | null => (open ? { 'data-popup-open': '' } : null),
};
