'use no memo';

import { type HTMLAttributes, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { useTransitionsSettled } from '../presence';
import { getDisplacement, resist, SWIPE_IGNORE_ATTRIBUTE, type SwipeDirection } from '../swipe';
import type { ToastObject } from './manager';
import { expandedStateAttributes, RootContext, type RootContextValue, useProviderContext } from './shared';

export type RootState = {
	type: string | undefined;
	expanded: boolean;
	limited: boolean;
	/** whether the toast is transitioning out. */
	closed: boolean;
};

export type RootProps = useRender.ComponentProps<'div', RootState> & {
	toast: ToastObject;
	/** swipe dismissal directions; defaults to down/right. an empty array disables swiping. */
	swipeDirection?: SwipeDirection | SwipeDirection[];
};

const SWIPE_THRESHOLD = 40;
const REVERSE_CANCEL_THRESHOLD = 10;
const LOCK_THRESHOLD = 2;
const SWIPE_IGNORE_SELECTOR = `${INTERACTIVE_SELECTOR}, input, select, textarea, [${SWIPE_IGNORE_ATTRIBUTE}]`;

const rootStateAttributes = {
	type: (type: string | undefined): Record<string, string> | null => (type ? { 'data-type': type } : null),
	...expandedStateAttributes,
	limited: (limited: boolean): Record<string, string> | null => (limited ? { 'data-limited': '' } : null),
	closed: (closed: boolean): Record<string, string> | null => (closed ? { 'data-closed': '' } : null),
};

// resist dragging in directions that cannot dismiss the toast.
const damp = (
	delta: number,
	directions: SwipeDirection[],
	positive: SwipeDirection,
	negative: SwipeDirection,
): number => {
	const allowed = directions.includes(delta > 0 ? positive : negative);
	return allowed ? delta : resist(delta);
};

// avoid React renders on pointer movement.
const setMovement = (el: HTMLElement, x: number, y: number): void => {
	el.style.setProperty('--toast-swipe-movement-x', `${x}px`);
	el.style.setProperty('--toast-swipe-movement-y', `${y}px`);
};

const DEFAULT_SWIPE_DIRECTION: SwipeDirection[] = ['down', 'right'];

type Gesture = {
	pointerId: number;
	startX: number;
	startY: number;
	axis: 'x' | 'y' | null;
	direction: SwipeDirection | null;
	maxDisplacement: number;
	x: number;
	y: number;
};

/**
 * renders a dismissible toast. Escape closes it when focus is within the toast. exposes `--toast-index`,
 * `--toast-offset-y`, and `--toast-height` for stacking. swipes set `--toast-swipe-movement-x`/`-y` and
 * `data-swiping`; dismissal sets `data-swipe-direction`. swipes ignore interactive descendants and elements
 * marked `data-swipe-ignore`.
 *
 * @param props toast, swipe directions, and element props
 * @returns the toast element; a `<div>` by default
 * @throws if the toast does not belong to the enclosing provider
 */
export const Root = ({
	render,
	ref,
	toast,
	swipeDirection = DEFAULT_SWIPE_DIRECTION,
	...elementProps
}: RootProps) => {
	const { manager, placements, expanded } = useProviderContext();
	const rootRef = useRef<HTMLDivElement | null>(null);
	const gestureRef = useRef<Gesture | null>(null);

	const titleId = useId();
	const descriptionId = useId();
	const [labels, setLabels] = useState({ description: 0, title: 0 });

	const directions = Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection];
	const horizontal = directions.includes('left') || directions.includes('right');
	const vertical = directions.includes('up') || directions.includes('down');
	const closed = toast.transitionStatus === 'ending';
	const placement = placements.get(toast.id);
	if (!placement) {
		throw new Error(`<Toast.Root> must render a toast from its provider`);
	}

	const setElement = useCallback(
		(el: HTMLDivElement | null) => {
			rootRef.current = el;
			manager.setElement(toast.id, el);
		},
		[manager, toast.id],
	);

	// #region height

	const measure = useNonReactiveCallback(() => {
		const el = rootRef.current;
		if (!el || closed) {
			return;
		}
		const prev = el.style.height;
		el.style.height = 'auto';
		const height = el.offsetHeight;
		el.style.height = prev;
		manager.setHeight(toast.id, height);
	});

	// remeasure after updates or reopening; observe width only to avoid height-transition feedback.
	useLayoutEffect(measure, [measure, toast.updateKey, closed]);
	useLayoutEffect(() => {
		const el = rootRef.current;
		if (!el) {
			return;
		}
		let width = el.offsetWidth;
		const observer = new ResizeObserver(([entry]) => {
			const next = entry?.borderBoxSize[0]?.inlineSize ?? width;
			if (next !== width) {
				width = next;
				measure();
			}
		});
		observer.observe(el);
		return () => {
			observer.disconnect();
		};
	}, [measure]);

	// #endregion

	const onSettled = useNonReactiveCallback((open: boolean) => {
		if (!open) {
			manager.remove(toast.id);
		}
	});
	useTransitionsSettled(rootRef, !closed, onSettled);

	// re-adding a closing toast's id reuses this element.
	useLayoutEffect(() => {
		const el = rootRef.current;
		if (el && !closed) {
			delete el.dataset.swipeDirection;
			el.style.removeProperty('--toast-swipe-movement-x');
			el.style.removeProperty('--toast-swipe-movement-y');
		}
	}, [closed]);

	// #region swipe

	const endGesture = (el: HTMLElement, gesture: Gesture, cancelled: boolean) => {
		gestureRef.current = null;
		// restore transitions before snapping back.
		el.removeAttribute('data-swiping');

		const { direction, x, y } = gesture;
		const displacement = direction ? getDisplacement(direction, x, y) : 0;
		const reversed = gesture.maxDisplacement - displacement >= REVERSE_CANCEL_THRESHOLD;
		if (!cancelled && direction && displacement > SWIPE_THRESHOLD && !reversed) {
			el.dataset.swipeDirection = direction;
			manager.close(toast.id);
		} else {
			setMovement(el, 0, 0);
		}
	};

	const swipeProps: HTMLAttributes<HTMLDivElement> = {
		onPointerDown(event) {
			const el = event.currentTarget;
			if (
				event.button !== 0 ||
				closed ||
				!(event.target instanceof Element) ||
				event.target.closest(SWIPE_IGNORE_SELECTOR)
			) {
				return;
			}
			el.setPointerCapture(event.pointerId);
			el.toggleAttribute('data-swiping', true);
			gestureRef.current = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startY: event.clientY,
				axis: null,
				direction: null,
				maxDisplacement: 0,
				x: 0,
				y: 0,
			};
		},
		onPointerMove(event) {
			const gesture = gestureRef.current;
			if (gesture?.pointerId !== event.pointerId) {
				return;
			}
			const dx = event.clientX - gesture.startX;
			const dy = event.clientY - gesture.startY;

			if (gesture.axis === null && Math.hypot(dx, dy) >= LOCK_THRESHOLD) {
				gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
				if (horizontal !== vertical) {
					gesture.axis = horizontal ? 'x' : 'y';
				}
				let candidate: SwipeDirection;
				if (gesture.axis === 'x') {
					candidate = dx > 0 ? 'right' : 'left';
				} else {
					candidate = dy > 0 ? 'down' : 'up';
				}
				gesture.direction = directions.includes(candidate) ? candidate : null;
			}
			if (gesture.axis === null) {
				return;
			}

			gesture.x = gesture.axis === 'x' ? damp(dx, directions, 'right', 'left') : 0;
			gesture.y = gesture.axis === 'y' ? damp(dy, directions, 'down', 'up') : 0;
			if (gesture.direction) {
				gesture.maxDisplacement = Math.max(
					gesture.maxDisplacement,
					getDisplacement(gesture.direction, gesture.x, gesture.y),
				);
			}
			setMovement(event.currentTarget, gesture.x, gesture.y);
		},
		onPointerUp(event) {
			const gesture = gestureRef.current;
			if (gesture?.pointerId === event.pointerId) {
				endGesture(event.currentTarget, gesture, false);
			}
		},
		onPointerCancel(event) {
			const gesture = gestureRef.current;
			if (gesture?.pointerId === event.pointerId) {
				endGesture(event.currentTarget, gesture, true);
			}
		},
	};

	// #endregion

	const registerLabel = useCallback((part: 'description' | 'title') => {
		setLabels((prev) => ({ ...prev, [part]: prev[part] + 1 }));
		return () => {
			setLabels((prev) => ({ ...prev, [part]: prev[part] - 1 }));
		};
	}, []);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'dialog',
		tabIndex: 0,
		inert: toast.limited || undefined,
		'aria-modal': false,
		'aria-labelledby': labels.title > 0 ? titleId : undefined,
		'aria-describedby': labels.description > 0 ? descriptionId : undefined,
		onKeyDown(event) {
			if (event.key === 'Escape') {
				manager.close(toast.id);
			}
		},
		...(directions.length > 0 && swipeProps),
		style: {
			// prevent scrolling from cancelling touch swipes.
			touchAction: directions.length > 0 ? 'none' : undefined,
			'--toast-index': placement.index,
			'--toast-offset-y': `${placement.offsetY}px`,
			'--toast-height': toast.height ? `${toast.height}px` : undefined,
		},
	};

	const element = useRender({
		render,
		ref: [ref ?? null, setElement],
		state: { type: toast.type, expanded, limited: toast.limited, closed },
		stateAttributesMapping: rootStateAttributes,
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'div'>(internalProps, elementProps),
	});

	const ctx: RootContextValue = {
		toast,
		expanded,
		behind: placement.index > 0,
		titleId,
		descriptionId,
		registerLabel,
	};

	return <RootContext value={ctx}>{element}</RootContext>;
};
