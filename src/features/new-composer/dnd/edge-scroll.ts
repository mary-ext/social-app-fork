import { clamp } from '#/lib/utils/numbers';

import { MEDIA_GRID_ATTR } from '../elements';

// include the rail gutter in the left-edge hit area.
const EDGE_SIZE = 56;
// pixels per second.
const MIN_SPEED = 60;
const MAX_SPEED = 420;

type Hit = { element: HTMLElement; speed: number };

const getSpeed = (distance: number): number => {
	const depth = clamp(1 - distance / EDGE_SIZE, 0, 1);
	return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * depth;
};

const findScroller = (container: Element, point: { clientX: number; clientY: number }): Hit | null => {
	for (const grid of container.querySelectorAll<HTMLElement>(`[${MEDIA_GRID_ATTR}]`)) {
		const max = grid.scrollWidth - grid.clientWidth;
		const rect = grid.getBoundingClientRect();
		if (max <= 0 || point.clientY < rect.top || point.clientY > rect.bottom) {
			continue;
		}

		const fromLeft = point.clientX - rect.left;
		const fromRight = rect.right - point.clientX;
		if (fromLeft < EDGE_SIZE && grid.scrollLeft > 0) {
			return { element: grid, speed: -getSpeed(fromLeft) };
		}
		if (fromRight < EDGE_SIZE && grid.scrollLeft < max) {
			return { element: grid, speed: getSpeed(fromRight) };
		}
		return null;
	}

	return null;
};

/** scrolls media strips while a drag holds the pointer near their edges. */
export type EdgeScroller = {
	/** re-evaluates the pointer; call on every drag movement. */
	update: (point: { clientX: number; clientY: number }) => void;
	/** stops scrolling; call when the drag leaves or ends. */
	stop: () => void;
};

/**
 * creates an edge scroller for a container's media strips. disable scroll snapping during drags.
 *
 * @param container the element hosting the editor
 * @returns the scroller
 */
export const createEdgeScroller = (container: Element): EdgeScroller => {
	let target: HTMLElement | null = null;
	let speed = 0;
	let frame = 0;
	let lastTime = 0;
	// retain fractional movement in case scrollLeft rounds it away.
	let position = 0;

	const stop = () => {
		cancelAnimationFrame(frame);
		frame = 0;
		target = null;
	};

	const tick = (time: number) => {
		if (!target) {
			return;
		}

		// cap the step so a stalled frame doesn't jump the strip; frame timestamps can precede `lastTime`.
		const elapsed = clamp(time - lastTime, 0, 50) / 1000;
		const max = target.scrollWidth - target.clientWidth;
		lastTime = time;
		position = clamp(position + speed * elapsed, 0, max);
		target.scrollLeft = position;

		if ((speed < 0 && position === 0) || (speed > 0 && position === max)) {
			stop();
		} else {
			frame = requestAnimationFrame(tick);
		}
	};

	return {
		update: (point) => {
			const hit = findScroller(container, point);
			if (hit?.element !== target) {
				stop();
			}
			if (!hit) {
				return;
			}

			speed = hit.speed;
			if (!frame) {
				target = hit.element;
				position = target.scrollLeft;
				lastTime = performance.now();
				frame = requestAnimationFrame(tick);
			}
		},
		stop,
	};
};
