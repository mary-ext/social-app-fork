import { clamp } from '#/lib/utils/numbers';

import { IMAGE_GROUP_ATTR } from '../shared/elements';
import { findScrollParent } from '../shared/scroll-parent';
import type { Point } from './drop-targets';

// includes the media strip's rail gutter.
const EDGE_SIZE = 56;
// pixels per second.
const MIN_SPEED = 60;
const MAX_SPEED = 420;

type Target = { element: HTMLElement; axis: 'x' | 'y' };

type Hit = Target & { speed: number };

const getScrollMax = ({ element, axis }: Target): number => {
	switch (axis) {
		case 'x': {
			return element.scrollWidth - element.clientWidth;
		}
		case 'y': {
			return element.scrollHeight - element.clientHeight;
		}
	}
};

const getScroll = ({ element, axis }: Target): number => {
	switch (axis) {
		case 'x': {
			return element.scrollLeft;
		}
		case 'y': {
			return element.scrollTop;
		}
	}
};

const setScroll = ({ element, axis }: Target, position: number): void => {
	switch (axis) {
		case 'x': {
			element.scrollLeft = position;
			break;
		}
		case 'y': {
			element.scrollTop = position;
			break;
		}
	}
};

type EdgeOffsets = { fromStart: number; fromEnd: number };

const getEdgeOffsets = ({ element, axis }: Target, point: Point): EdgeOffsets | null => {
	const rect = element.getBoundingClientRect();
	switch (axis) {
		case 'x': {
			if (point.clientY < rect.top || point.clientY > rect.bottom) {
				return null;
			}
			return { fromStart: point.clientX - rect.left, fromEnd: rect.right - point.clientX };
		}
		case 'y': {
			if (point.clientX < rect.left || point.clientX > rect.right) {
				return null;
			}
			return { fromStart: point.clientY - rect.top, fromEnd: rect.bottom - point.clientY };
		}
	}
};

// pointers past the edge scroll at full speed.
const getSpeed = (distance: number): number => {
	const depth = clamp(1 - distance / EDGE_SIZE, 0, 1);
	return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * depth;
};

const getEdgeHit = (target: Target, { fromStart, fromEnd }: EdgeOffsets): Hit | null => {
	const scroll = getScroll(target);
	if (fromStart < EDGE_SIZE && scroll > 0) {
		return { ...target, speed: -getSpeed(fromStart) };
	}
	if (fromEnd < EDGE_SIZE && scroll < getScrollMax(target)) {
		return { ...target, speed: getSpeed(fromEnd) };
	}
	return null;
};

const findStripHit = (container: Element, point: Point): Hit | null => {
	for (const group of container.querySelectorAll<HTMLElement>(`[${IMAGE_GROUP_ATTR}]`)) {
		const target: Target = { element: group, axis: 'x' };
		const offsets = getScrollMax(target) > 0 && getEdgeOffsets(target, point);
		if (offsets) {
			return getEdgeHit(target, offsets);
		}
	}

	return null;
};

const findThreadHit = (scroller: HTMLElement, point: Point): Hit | null => {
	const target: Target = { element: scroller, axis: 'y' };
	const offsets = getEdgeOffsets(target, point);
	return offsets && getEdgeHit(target, offsets);
};

/** scrolls the thread and its media strips while a drag holds the pointer near their edges. */
export type EdgeScroller = {
	/**
	 * updates the scroll target and speed; call on each drag movement.
	 *
	 * @param point the pointer's position
	 * @param options enables media-strip scrolling, which takes priority over thread scrolling
	 */
	update: (point: Point, options: { strips: boolean }) => void;
	/** stops scrolling; call when the drag ends. */
	stop: () => void;
};

/**
 * creates an edge scroller for the thread and its media strips. disable scroll snapping during drags.
 *
 * @param container the element hosting the editor
 * @returns the scroller
 */
export const createEdgeScroller = (container: HTMLElement): EdgeScroller => {
	let scroller: HTMLElement | null = null;
	let target: Hit | null = null;
	let frame = 0;
	let lastTime = 0;
	// preserve fractional movement when the browser rounds scroll positions.
	let position = 0;

	const stop = () => {
		cancelAnimationFrame(frame);
		frame = 0;
		target = null;
		scroller = null;
	};

	const tick = (time: number) => {
		if (!target) {
			return;
		}

		// limit jumps after stalled frames; frame timestamps can precede `lastTime`.
		const elapsed = clamp(time - lastTime, 0, 50) / 1000;
		const max = getScrollMax(target);
		lastTime = time;
		position = clamp(position + target.speed * elapsed, 0, max);
		setScroll(target, position);

		if ((target.speed < 0 && position === 0) || (target.speed > 0 && position === max)) {
			stop();
		} else {
			frame = requestAnimationFrame(tick);
		}
	};

	return {
		update: (point, { strips }) => {
			scroller ??= findScrollParent(container);
			const hit =
				(strips ? findStripHit(container, point) : null) ?? (scroller && findThreadHit(scroller, point));
			if (hit?.element !== target?.element) {
				stop();
			}
			if (!hit) {
				return;
			}

			target = hit;
			if (!frame) {
				position = getScroll(hit);
				lastTime = performance.now();
				frame = requestAnimationFrame(tick);
			}
		},
		stop,
	};
};
