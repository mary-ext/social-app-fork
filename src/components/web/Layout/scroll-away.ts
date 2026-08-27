import type { StyleRule } from '@vanilla-extract/css';

export const TIMELINE = '--scroll-away';

export const SUPPORTS = `(timeline-scope: ${TIMELINE})`;

export const OVERLAP = '--scroll-away-overlap';

const LEAD_IN = 0.25;

const RANGE = `exit calc(${LEAD_IN * 100}% + ${1 - LEAD_IN} * var(${OVERLAP}, 0px)) exit 100%`;

/**
 * creates a scroll-driven animation rule with a static fallback.
 *
 * @param animation keyframes
 * @param settled fallback state
 * @returns composable style rule
 */
export const driven = (animation: string, settled: StyleRule): StyleRule => ({
	'@supports': {
		[SUPPORTS]: {
			animationName: animation,
			animationTimingFunction: 'linear',
			animationFillMode: 'both',
			animationTimeline: TIMELINE,
			animationRange: RANGE,
		},
		[`not ${SUPPORTS}`]: settled,
	},
});
