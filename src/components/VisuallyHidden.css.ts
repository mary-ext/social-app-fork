import { style } from '@vanilla-extract/css';

export const root = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clipPath: 'inset(50%)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});
