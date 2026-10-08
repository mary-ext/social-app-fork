import './position-try.css';

import { type CSSProperties, type RefCallback, type RefObject, useCallback, useLayoutEffect } from 'react';

import { type DataAttributes, dataAttributes } from './data-attributes';
import { getOpenAttributes, useTransitionsSettled } from './presence';

export type Side = 'bottom' | 'left' | 'right' | 'top';
export type Align = 'center' | 'end' | 'start';

/** minimum distance from the viewport edges, in pixels; one number applies to every side. */
export type CollisionPadding = number | Partial<Record<Side, number>>;

/** default distance from the viewport edges, in pixels. */
export const COLLISION_PADDING = 5;

export type PlacementProps = {
	/** preferred side; flips when space is insufficient. */
	side?: Side;
	/** alignment along the anchor's edge. */
	align?: Align;
	/** gap between anchor and popup, in pixels. */
	sideOffset?: number;
	/** viewport clearance; defaults to {@link COLLISION_PADDING}. */
	collisionPadding?: CollisionPadding;
};

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

// prefer aligned placements before allowing cross-axis shifting.
const getFallbacks = (side: Side, align: Align): string[] => {
	const [sideFlip, alignFlip] = isVertical(side)
		? ['flip-block', 'flip-inline']
		: ['flip-inline', 'flip-block'];
	if (align === 'center') {
		return [sideFlip];
	}
	return [sideFlip, alignFlip, `${sideFlip} ${alignFlip}`, side, OPPOSITE[side]];
};

const MARGIN = {
	bottom: 'marginBottom',
	left: 'marginLeft',
	right: 'marginRight',
	top: 'marginTop',
} as const;

/**
 * anchors a popup, flipping or shifting to maintain viewport clearance.
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
	const inlineMargins =
		(resolveCollisionPadding(collisionPadding, 'left') ?? 0) +
		(resolveCollisionPadding(collisionPadding, 'right') ?? 0);
	const style: CSSProperties = {
		positionAnchor: anchorName,
		positionArea: getPositionArea(side, align),
		positionTryFallbacks: getFallbacks(side, align).join(', '),
		[MARGIN[OPPOSITE[side]]]: sideOffset,
		'--anchored-inline-margins': `${inlineMargins}px`,
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
 * anchors a popup above or below, flipping, shifting, or shrinking to fit the viewport. requires
 * `shrinkingPositioner` and scrollable popup content.
 *
 * @param options anchor name and placement
 * @returns styles for the positioning element
 */
export const getShrinkingAnchoredStyle = (
	options: Parameters<typeof getAnchoredStyle>[0] & { side: 'bottom' | 'top' },
): CSSProperties => {
	const { side, align, sideOffset, collisionPadding } = options;
	const margins = sideOffset + (resolveCollisionPadding(collisionPadding, side) ?? 0);

	let shrinkFallbacks: string[];
	if (align === 'center') {
		shrinkFallbacks = [
			'--anchored-shrink-floored',
			'--anchored-shrink-floored flip-block',
			'--anchored-shrink',
		];
	} else {
		const toSide = side === 'top' ? ' flip-block' : '';
		const toOpposite = side === 'top' ? '' : ' flip-block';
		shrinkFallbacks = [
			'--anchored-shrink-floored',
			'--anchored-shrink-floored flip-inline',
			'--anchored-shrink-floored flip-block',
			'--anchored-shrink-floored flip-block flip-inline',
			`--anchored-shrink-floored-span${toSide}`,
			`--anchored-shrink-floored-span${toOpposite}`,
			'--anchored-shrink',
			'--anchored-shrink flip-inline',
			`--anchored-shrink-span${toSide}`,
		];
	}

	return {
		...getAnchoredStyle(options),
		positionTryFallbacks: [...getFallbacks(side, align), ...shrinkFallbacks].join(', '),
		'--anchored-block-margins': `${margins}px`,
	};
};

/**
 * @param open whether the popup is open
 * @param side preferred side, before collision handling
 * @param align requested alignment
 * @returns open-state attributes plus `data-side` and `data-align` for the requested placement
 */
export const getPositionerAttributes = (open: boolean, side: Side, align: Align): DataAttributes => {
	return { ...getOpenAttributes(open), ...dataAttributes({ side, align }) };
};

/**
 * tracks transitions and snaps an open popup to device pixels. owns inline `translate`. make the positioner
 * `inert` while closed to block focus and input during exit transitions.
 *
 * @param ref popup positioning element
 * @param open current open state
 * @param onTransitionSettled receives the open state once its transitions finish
 */
export const useAnchoredPositioner = (
	ref: RefObject<HTMLElement | null>,
	open: boolean,
	onTransitionSettled: (open: boolean) => void,
): void => {
	useTransitionsSettled(ref, open, onTransitionSettled);
	useDevicePixelSnap(ref, open);
};

const useDevicePixelSnap = (ref: RefObject<HTMLElement | null>, open: boolean): void => {
	useLayoutEffect(() => {
		const el = ref.current;
		if (!open || !el) {
			return;
		}

		// fractional anchor coordinates can paint the popup a pixel larger than its content once compositing ends.
		// translate preserves anchor collision handling.
		let x = 0;
		let y = 0;
		const snap = (): void => {
			const dpr = devicePixelRatio;
			const rect = el.getBoundingClientRect();
			const left = rect.left - x;
			const top = rect.top - y;
			const nextX = Math.round(left * dpr) / dpr - left;
			const nextY = Math.round(top * dpr) / dpr - top;
			if (nextX !== x || nextY !== y) {
				x = nextX;
				y = nextY;
				el.style.translate = `${x}px ${y}px`;
			}
		};

		el.style.removeProperty('translate');

		// ResizeObserver supplies the initial snap before paint.
		const observer = new ResizeObserver(snap);
		observer.observe(el);
		window.addEventListener('resize', snap);
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', snap);
		};
	}, [open, ref]);
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
 * calls `onOutside` for clicks that start and end outside the popup and trigger.
 *
 * @param options.signal removes the listeners once aborted
 * @param options.isInside whether an event belongs to the popup or its trigger
 * @param options.onOutside receives the dismissing click or touch press
 * @param options.dismissTouchOnContact dismisses touch presses on contact instead of on click
 */
export const listenForOutsideClick = ({
	signal,
	isInside,
	onOutside,
	dismissTouchOnContact,
}: {
	signal: AbortSignal;
	isInside: (event: Event) => boolean;
	onOutside: (event: Event) => void;
	dismissTouchOnContact: boolean;
}): void => {
	let pressedOutside = false;
	const onPointerDown = (event: PointerEvent) => {
		pressedOutside = !isInside(event);
		if (pressedOutside && dismissTouchOnContact && event.pointerType === 'touch') {
			pressedOutside = false;
			onOutside(event);
		}
	};
	const onClick = (event: MouseEvent) => {
		if (pressedOutside && !isInside(event)) {
			onOutside(event);
		}
		pressedOutside = false;
	};

	document.addEventListener('pointerdown', onPointerDown, { signal });
	document.addEventListener('click', onClick, { signal });
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

/**
 * @param name dashed anchor name, or `undefined` to skip registration
 * @returns a ref callback, stable for an unchanged name, that adds on attach and removes on detach
 */
export const useAnchorName = (name: string | undefined): RefCallback<HTMLElement> => {
	return useCallback(
		(el: HTMLElement | null) => {
			if (el && name !== undefined) {
				return addAnchorName(el, name);
			}
		},
		[name],
	);
};

/** minimum gap-crossing time for hoverable popups, in milliseconds. */
export const HOVERABLE_GRACE = 100;
