import {
	type CSSProperties,
	type PointerEvent,
	type ReactNode,
	type ReactPortal,
	type RefObject,
	useLayoutEffect,
	useState,
} from 'react';

import { createPortal } from 'react-dom';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

export type Side = 'bottom' | 'left' | 'right' | 'top';
export type Align = 'center' | 'end' | 'start';

/** minimum distance from the viewport edges, in pixels; one number applies to every side. */
export type CollisionPadding = number | Partial<Record<Side, number>>;

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

	// margins provide collision padding and flip with the placement.
	const padding =
		typeof collisionPadding === 'number'
			? { bottom: collisionPadding, left: collisionPadding, right: collisionPadding, top: collisionPadding }
			: collisionPadding;

	const [start, end]: [Side, Side] = isVertical(side) ? ['left', 'right'] : ['top', 'bottom'];
	const edges: Side[] = [side];
	// padding the anchor-aligned edge would shift the alignment.
	if (align !== 'end') {
		edges.push(end);
	}
	if (align !== 'start') {
		edges.push(start);
	}
	for (const edge of edges) {
		const value = padding[edge];
		if (value !== undefined) {
			style[MARGIN[edge]] = value;
		}
	}

	return style;
};

/**
 * keeps a popup mounted until its exit transitions finish.
 *
 * @param open current open state
 * @param onOpenChangeComplete receives the open state once its transitions finish
 * @returns whether the popup is mounted, and the callback to pass to {@link useTopLayerPresence}
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
 * shows a mounted popover in the top layer and reports completed open/close transitions.
 *
 * @param ref the popover element
 * @param open current open state
 * @param onSettled receives the open state once its transitions finish
 */
export const useTopLayerPresence = (
	ref: RefObject<HTMLElement | null>,
	open: boolean,
	onSettled: (open: boolean) => void,
): void => {
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		if (!el.matches(':popover-open')) {
			el.showPopover();
		}

		// canceled animations reject `finished`; the next effect handles the replacement transitions.
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
				() => {},
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

/**
 * @param event pointer event to classify
 * @returns whether the pointer is a mouse or pen
 */
export const isMouseLike = (event: PointerEvent): boolean => {
	// some Linux Chromium builds report mouse input as "pen".
	return event.pointerType === 'mouse' || event.pointerType === 'pen';
};

export type PortalContainer = HTMLElement | RefObject<HTMLElement | null> | null;

/**
 * portals popup content. the target controls inherited styles, not top-layer placement.
 *
 * @param children popup content
 * @param container portal target; defaults to `document.body` when absent or the ref is empty
 * @returns a portal into the container
 */
export const createPopupPortal = (
	children: ReactNode,
	container: PortalContainer | undefined,
): ReactPortal => {
	const target = container && 'current' in container ? container.current : container;
	return createPortal(children, target ?? document.body);
};

export const openStateAttributes = {
	open: (open: boolean): Record<string, string> => (open ? { 'data-open': '' } : { 'data-closed': '' }),
};

export const triggerStateAttributes = {
	open: (open: boolean): Record<string, string> | null => (open ? { 'data-popup-open': '' } : null),
};
