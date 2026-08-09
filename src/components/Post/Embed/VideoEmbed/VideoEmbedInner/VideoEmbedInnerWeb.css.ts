import { style } from '@vanilla-extract/css';

export const root = style({
	display: 'flex',
	position: 'relative',
	flex: 1,
	overflow: 'hidden',
});

export const srOnly = style({
	position: 'absolute',
	transform: 'scale(0)',
});
