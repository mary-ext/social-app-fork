import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

export const tile = style({
	appearance: 'none',
	background: 'none',
	border: 'none',
	borderRadius: borderRadius.sm,
	cursor: 'pointer',
	display: 'block',
	margin: 0,
	padding: 0,
	width: '100%',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const image = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: borderRadius.sm,
	display: 'block',
	objectFit: 'cover',
	transitionDuration: '100ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'ease',
	width: '100%',
	selectors: {
		[`${tile}:active &`]: { opacity: 0.85, transform: 'scale(0.97)' },
	},
});
