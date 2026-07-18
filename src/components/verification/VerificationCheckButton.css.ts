import { style } from '@vanilla-extract/css';

export const button = style({
	display: 'inline-flex',
	transition: 'transform 0.1s',
	border: 0,
	background: 'none',
	padding: 0,
	cursor: 'pointer',
	':hover': { transform: 'scale(1.1)' },
});
