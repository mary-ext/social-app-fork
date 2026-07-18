import { style } from '@vanilla-extract/css';

export const container = style({
	position: 'relative',
});

export const row = style({
	display: 'flex',
	contain: 'content',
	flexDirection: 'column',
	flexShrink: 0,
});

export const aboveTheFold = style({
	position: 'absolute',
	insetInline: 0,
	top: 0,
	zIndex: -1,
	pointerEvents: 'none',
});

export const sentinel = style({
	zIndex: -1,
	pointerEvents: 'none',
});
