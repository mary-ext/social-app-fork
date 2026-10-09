import { type CSSProperties, type RefCallback, type RefObject, useCallback, useLayoutEffect } from 'react';

import { assignInlineVars, setElementVars } from '@vanilla-extract/dynamic';

import * as styles from './anchored-popup.css';
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

const getCollisionPadding = (padding: CollisionPadding, edge: Side): number | undefined => {
	return typeof padding === 'number' ? padding : padding[edge];
};

const getCollisionPaddingLength = (padding: CollisionPadding, edge: Side): string | undefined => {
	const value = getCollisionPadding(padding, edge);
	return value === undefined ? undefined : `${value}px`;
};

/**
 * use with `manualPositioner` for custom positioning.
 *
 * @param open whether the popup is open
 * @param side popup side
 * @param align requested alignment
 * @returns open-state attributes, `data-side`, and `data-align`
 */
export const getPositionerAttributes = (open: boolean, side: Side, align: Align): DataAttributes => {
	return { ...getOpenAttributes(open), ...dataAttributes({ side, align }) };
};

/**
 * supplies placement props for the `positioner` class.
 *
 * @param open whether the popup is open
 * @param placement anchor name and placement
 * @returns {@link getPositionerAttributes} plus the anchoring style
 */
export const getPositionerProps = (
	open: boolean,
	{
		anchorName,
		side,
		align,
		sideOffset,
		collisionPadding,
	}: Required<PlacementProps> & {
		anchorName: string;
	},
): DataAttributes & { style: CSSProperties } => {
	return {
		...getPositionerAttributes(open, side, align),
		style: {
			positionAnchor: anchorName,
			...assignInlineVars({
				[styles.sideOffsetVar]: `${sideOffset}px`,
				[styles.collisionPaddingVars.bottom]: getCollisionPaddingLength(collisionPadding, 'bottom'),
				[styles.collisionPaddingVars.left]: getCollisionPaddingLength(collisionPadding, 'left'),
				[styles.collisionPaddingVars.right]: getCollisionPaddingLength(collisionPadding, 'right'),
				[styles.collisionPaddingVars.top]: getCollisionPaddingLength(collisionPadding, 'top'),
			}),
		},
	};
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

/**
 * sets `availableSizeVars` to fit the roomier of `side` and its opposite. use with `shrinkingPositioner`;
 * variables are cleared while closed or without an anchor.
 *
 * @param ref popup positioning element
 * @param anchorOrRef anchor element or ref; ref targets must stay stable while open; `null` disables sizing
 * @param open current open state
 * @param placement preferred side, gap, and viewport clearance
 */
export const useAvailableSize = (
	ref: RefObject<HTMLElement | null>,
	anchorOrRef: Element | RefObject<Element | null> | null,
	open: boolean,
	{ side, sideOffset, collisionPadding }: Required<Omit<PlacementProps, 'align'>>,
): void => {
	// depend on edge values, not padding object identity.
	const padTop = getCollisionPadding(collisionPadding, 'top') ?? 0;
	const padRight = getCollisionPadding(collisionPadding, 'right') ?? 0;
	const padBottom = getCollisionPadding(collisionPadding, 'bottom') ?? 0;
	const padLeft = getCollisionPadding(collisionPadding, 'left') ?? 0;

	useLayoutEffect(() => {
		const el = ref.current;
		const anchor = anchorOrRef === null || anchorOrRef instanceof Element ? anchorOrRef : anchorOrRef.current;
		if (!open || !el || !anchor) {
			return;
		}

		// round down to avoid subpixel overflow rejecting a placement.
		const toLength = (value: number): string => `${Math.max(0, Math.floor(value))}px`;

		let lastHeight = '';
		let lastWidth = '';
		const update = (): void => {
			// exclude scrollbars to match the fixed-position containing block.
			const { clientWidth, clientHeight } = document.documentElement;
			const rect = anchor.getBoundingClientRect();

			let width = clientWidth - padLeft - padRight;
			let height = clientHeight - padTop - padBottom;
			switch (side) {
				case 'bottom':
				case 'top': {
					height = Math.max(rect.top - padTop, clientHeight - rect.bottom - padBottom) - sideOffset;
					break;
				}
				case 'left':
				case 'right': {
					width = Math.max(rect.left - padLeft, clientWidth - rect.right - padRight) - sideOffset;
					break;
				}
			}

			// avoid invalidating inherited styles on every scroll.
			const nextHeight = toLength(height);
			const nextWidth = toLength(width);
			if (nextHeight !== lastHeight || nextWidth !== lastWidth) {
				lastHeight = nextHeight;
				lastWidth = nextWidth;
				setElementVars(el, {
					[styles.availableSizeVars.height]: nextHeight,
					[styles.availableSizeVars.width]: nextWidth,
				});
			}
		};

		const controller = new AbortController();
		const { signal } = controller;
		// measure after layout effects, before paint, so callers can read uncapped dimensions first.
		const observer = new ResizeObserver(update);
		observer.observe(anchor);
		window.addEventListener('resize', update, { signal });
		// ignore popup scrolling; it does not move the anchor.
		document.addEventListener(
			'scroll',
			(event) => {
				if (!(event.target instanceof Node && el.contains(event.target))) {
					update();
				}
			},
			{ capture: true, passive: true, signal },
		);
		return () => {
			controller.abort();
			observer.disconnect();
			setElementVars(el, {
				[styles.availableSizeVars.height]: null,
				[styles.availableSizeVars.width]: null,
			});
		};
	}, [ref, anchorOrRef, open, side, sideOffset, padTop, padRight, padBottom, padLeft]);
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
 * modal popups must wait for click; closing on touch contact lets the tap reach content underneath.
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
