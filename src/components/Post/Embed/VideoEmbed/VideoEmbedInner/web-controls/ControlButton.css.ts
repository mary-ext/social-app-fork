import { style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const button = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'background-color 0.1s',
	margin: 0,
	border: 0,
	borderRadius: borderRadius.full,
	background: 'transparent',
	padding: space.xs,
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
	},
});
