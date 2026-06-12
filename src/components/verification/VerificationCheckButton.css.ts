import { style } from '@vanilla-extract/css';

export const button = style({
	':hover': { transform: 'scale(1.1)' },
	background: 'none',
	border: 0,
	cursor: 'pointer',
	display: 'inline-flex',
	padding: 0,
	transition: 'transform 0.1s',
});

export const icon = style({
	display: 'inline-flex',
});
