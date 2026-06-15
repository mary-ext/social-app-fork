import { createVar, style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

/** Progress as a percentage string (e.g. `40%`), driving the fill width and circle offset. */
export const progressVar = createVar();
/** Scrubber-handle scale: 0 hidden, 0.6 hover/focus, 1 while seeking. */
export const scaleVar = createVar();

export const scrubber = style({
	// border-box so the width:100% + padding doesn't overflow (RN Views default to border-box).
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	height: 18,
	paddingInline: space.xs,
	width: '100%',
});

export const scrubberTouch = style({ height: 32 });

export const bar = style({
	alignItems: 'center',
	cursor: 'grab',
	display: 'flex',
	flex: 1,
	padding: '4px 0',
	position: 'relative',
	selectors: {
		'&[data-active="true"]': { cursor: 'grabbing' },
	},
});

export const track = style({
	backgroundColor: 'rgba(255, 255, 255, 0.4)',
	borderRadius: borderRadius.full,
	height: 3,
	overflow: 'hidden',
	transition: 'height 0.1s ease',
	width: '100%',
	selectors: {
		[`${bar}[data-expanded="true"] &`]: { height: 6 },
	},
});

export const fill = style({
	backgroundColor: '#fff',
	height: '100%',
	width: progressVar,
});

export const circle = style({
	borderRadius: 8,
	height: 16,
	left: `calc(${progressVar} - 8px)`,
	pointerEvents: 'none',
	position: 'absolute',
	width: 16,
});

export const circleInner = style({
	backgroundColor: '#fff',
	borderRadius: borderRadius.full,
	height: '100%',
	transform: `scale(${scaleVar})`,
	width: '100%',
});
