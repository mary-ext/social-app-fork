import { style } from '@vanilla-extract/css';

export const root = style({
	display: 'flex',
	position: 'relative',
	flex: 1,
	overflow: 'hidden',
});

export const srOnly = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clip: 'rect(0 0 0 0)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});
