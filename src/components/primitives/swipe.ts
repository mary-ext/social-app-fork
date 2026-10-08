export type SwipeDirection = 'down' | 'left' | 'right' | 'up';

/** prevents swipe dismissal from starting on an element or its descendants. */
export const SWIPE_IGNORE_ATTRIBUTE = 'data-swipe-ignore';

/**
 * @param direction dismissal direction
 * @param dx horizontal movement
 * @param dy vertical movement
 * @returns movement toward the direction; negative when moving away from it
 */
export const getDisplacement = (direction: SwipeDirection, dx: number, dy: number): number => {
	switch (direction) {
		case 'down': {
			return dy;
		}
		case 'left': {
			return -dx;
		}
		case 'right': {
			return dx;
		}
		case 'up': {
			return -dy;
		}
	}
};

/**
 * @param delta movement in a direction that can't dismiss
 * @returns signed movement with square-root resistance
 */
export const resist = (delta: number): number => {
	return Math.sign(delta) * Math.abs(delta) ** 0.5;
};
