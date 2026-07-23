import { createVar, globalStyle, style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const progressVar = createVar();
export const scaleVar = createVar();

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

export const circle = style({
	position: 'absolute',
	left: `calc(${progressVar} - 8px)`,
	width: 16,
	height: 16,
	borderRadius: 8,
	pointerEvents: 'none',
});

export const circleInner = style({
	width: '100%',
	height: '100%',
	borderRadius: borderRadius.full,
	backgroundColor: '#fff',
	transform: `scale(${scaleVar})`,
});

export const fill = style({
	width: progressVar,
	height: '100%',
	backgroundColor: '#fff',
});

export const forceNoClicks = style({});

globalStyle(`${forceNoClicks} *`, {
	pointerEvents: 'none',
});

export const scrubber = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	width: '100%',
	height: 18,
	paddingInline: space.xs,
});

export const scrubberTouch = style({ height: 32 });

export const track = style({
	width: '100%',
	height: 3,
	overflow: 'hidden',
	borderRadius: borderRadius.full,
	backgroundColor: 'rgba(255, 255, 255, 0.4)',
	transition: 'height 0.1s ease',
	selectors: {
		[`${bar}[data-expanded="true"] &`]: { height: 6 },
	},
});
