import { style } from '@vanilla-extract/css';

export const label = style({
	position: 'absolute',
	bottom: -4,
	left: 0,
	zIndex: 1000,
	maxWidth: 65,
	padding: 0,
	appearance: 'none',
	border: 0,
	background: 'none',
	cursor: 'pointer',
});

export const text = style({
	lineHeight: 'normal',
	fontSize: 7,
});
