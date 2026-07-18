import { createVar, style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const progressVar = createVar();
export const scaleVar = createVar();

export const scrubber = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	paddingInline: space.xs,
	width: '100%',
	height: 18,
});

export const scrubberTouch = style({ height: 32 });

export const bar = style({
	display: 'flex',
	position: 'relative',
	flex: 1,
	alignItems: 'center',
	padding: '4px 0',
	cursor: 'grab',
	selectors: {
		'&[data-active="true"]': { cursor: 'grabbing' },
	},
});

export const track = style({
	transition: 'height 0.1s ease',
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.4)',
	width: '100%',
	height: 3,
	overflow: 'hidden',
	selectors: {
		[`${bar}[data-expanded="true"] &`]: { height: 6 },
	},
});

export const fill = style({
	backgroundColor: '#fff',
	width: progressVar,
	height: '100%',
});

export const circle = style({
	position: 'absolute',
	left: `calc(${progressVar} - 8px)`,
	borderRadius: 8,
	width: 16,
	height: 16,
	pointerEvents: 'none',
});

export const circleInner = style({
	transform: `scale(${scaleVar})`,
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
	width: '100%',
	height: '100%',
});
