import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const base = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	color: 'inherit',
	cursor: 'pointer',
	display: 'inline-flex',
	font: 'inherit',
	justifyContent: 'center',
	margin: 0,
	padding: 0,
	textDecoration: 'none',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: '2px',
		},
		'&:disabled': {
			cursor: 'default',
			opacity: 0.5,
		},
	},
});

export const variant = styleVariants({
	bare: {
		display: 'block',
		textAlign: 'left',
		width: '100%',
	},
	ghost: {
		color: vars.palette.contrast_600,
		selectors: {
			'&:hover:not(:disabled)': { backgroundColor: vars.palette.contrast_50 },
			'&:active:not(:disabled)': { backgroundColor: vars.palette.contrast_100 },
		},
	},
});

/** A square, pill-rounded hit target sized for header icon buttons. */
export const round = style({
	borderRadius: '999px',
	height: '34px',
	width: '34px',
});
