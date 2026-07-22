import { style } from '@vanilla-extract/css';

export const screen = style({
	flex: 1,
	minHeight: 0,
});

export const inner = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minHeight: 0,
});

export const full = style({
	width: '100%',
});
