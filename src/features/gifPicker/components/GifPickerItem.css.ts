import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

export const tile = style({
	appearance: 'none',
	display: 'block',
	margin: 0,
	border: 'none',
	borderRadius: borderRadius.sm,
	background: 'none',
	padding: 0,
	width: '100%',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const image = style({
	display: 'block',
	transitionDuration: '100ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'ease',
	borderRadius: borderRadius.sm,
	backgroundColor: vars.palette.contrast_25,
	width: '100%',
	objectFit: 'cover',
	selectors: {
		[`${tile}:active &`]: { transform: 'scale(0.97)', opacity: 0.85 },
	},
});
