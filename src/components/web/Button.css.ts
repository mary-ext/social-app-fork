import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

export const base = style({
	alignItems: 'center',
	appearance: 'none',
	border: 'none',
	borderRadius: '999px',
	color: 'inherit',
	cursor: 'pointer',
	display: 'inline-flex',
	fontFamily: 'inherit',
	fontWeight: 600,
	justifyContent: 'center',
	margin: 0,
	textDecoration: 'none',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color, border-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	whiteSpace: 'nowrap',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '2px' },
		'&:disabled': { cursor: 'default', opacity: 0.5 },
	},
});

export const size = styleVariants({
	large: {
		fontSize: fontSize.md,
		gap: '6px',
		paddingBlock: '12px',
		paddingInline: '24px',
	},
	small: {
		fontSize: fontSize.sm,
		gap: '5px',
		paddingBlock: '8px',
		paddingInline: '14px',
	},
});

export const solid = styleVariants({
	negative: {
		backgroundColor: vars.palette.negative_500,
		color: vars.palette.white,
		selectors: { '&:hover:not(:disabled)': { backgroundColor: vars.palette.negative_600 } },
	},
	primary: {
		backgroundColor: vars.palette.primary_500,
		color: vars.palette.white,
		selectors: { '&:hover:not(:disabled)': { backgroundColor: vars.palette.primary_600 } },
	},
	secondary: {
		backgroundColor: vars.palette.contrast_50,
		color: vars.palette.contrast_700,
		selectors: { '&:hover:not(:disabled)': { backgroundColor: vars.palette.contrast_100 } },
	},
});

export const ghost = styleVariants({
	negative: {
		backgroundColor: 'transparent',
		color: vars.palette.negative_600,
		selectors: { '&:hover:not(:disabled)': { backgroundColor: vars.palette.negative_100 } },
	},
	primary: {
		backgroundColor: 'transparent',
		color: vars.palette.primary_600,
		selectors: { '&:hover:not(:disabled)': { backgroundColor: vars.palette.primary_100 } },
	},
	secondary: {
		backgroundColor: 'transparent',
		color: vars.palette.contrast_600,
		selectors: { '&:hover:not(:disabled)': { backgroundColor: vars.palette.contrast_50 } },
	},
});

/** Unstyled clickable that inherits its surroundings (e.g. a full-row pressable). */
export const bare = style({
	backgroundColor: 'transparent',
	color: 'inherit',
});

/** A square, pill-rounded hit target sized for header icon buttons. */
export const round = style({
	backgroundColor: 'transparent',
	height: '34px',
	padding: 0,
	width: '34px',
});
