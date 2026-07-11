import { style } from '@vanilla-extract/css';

export const container = style({
	position: 'relative',
});

export const row = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	contain: 'content',
});

export const aboveTheFold = style({
	insetInline: 0,
	pointerEvents: 'none',
	position: 'absolute',
	top: 0,
	zIndex: -1,
});

export const sentinel = style({
	pointerEvents: 'none',
	zIndex: -1,
});
