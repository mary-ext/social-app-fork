import { style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const button = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 0,
	borderRadius: borderRadius.full,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	margin: 0,
	padding: space.xs,
	transition: 'background-color 0.1s',
	selectors: {
		'&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
	},
});
