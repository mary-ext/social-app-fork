import { style } from '@vanilla-extract/css';

export const label = style({
	bottom: -4,
	cursor: 'pointer',
	left: 0,
	maxWidth: 65,
	position: 'absolute',
	zIndex: 1000,
});

export const text = style({
	fontSize: 7,
	lineHeight: 'normal',
});
