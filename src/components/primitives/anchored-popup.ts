import './position-try.css';

import type { CSSProperties } from 'react';

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
 * @param positioner popup positioning element
 * @param target event target
 * @returns whether the target is a descendant of the positioner
 */
export const isWithinPopup = (positioner: HTMLElement | null, target: EventTarget | null): boolean => {
	// backdrop presses target the positioner itself.
	return target instanceof Node && target !== positioner && !!positioner?.contains(target);
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
