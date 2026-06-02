import { style } from '@vanilla-extract/css';

import { fontSize } from '#/styles/tokens';

import { vars } from '#/styles/contract.css';

const FONT_FAMILY = `InterVariable, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

export const label = style({
	color: vars.palette.contrast_700,
	display: 'block',
	fontFamily: FONT_FAMILY,
	fontSize: `calc(var(--font-scale, 1) * ${fontSize.sm}px)`,
	fontWeight: 500,
	marginBottom: '8px',
});

export const input = style({
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: '1px solid transparent',
	borderRadius: '10px',
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	display: 'block',
	fontFamily: FONT_FAMILY,
	fontSize: `calc(var(--font-scale, 1) * ${fontSize.md}px)`,
	lineHeight: 1.2,
	margin: 0,
	outline: 'none',
	paddingBlock: '13px',
	paddingInline: '12px',
	width: '100%',
	selectors: {
		'&::placeholder': { color: vars.palette.contrast_500 },
		'&:hover': { borderColor: vars.palette.contrast_100 },
		'&:focus': { backgroundColor: vars.palette.primary_25, borderColor: vars.palette.primary_500 },
	},
});

export const invalid = style({
	backgroundColor: vars.palette.negative_25,
	borderColor: vars.palette.negative_300,
	selectors: {
		'&:hover': { borderColor: vars.palette.negative_500 },
		'&:focus': { backgroundColor: vars.palette.negative_25, borderColor: vars.palette.negative_500 },
	},
});

export const multiline = style({
	minHeight: '80px',
	resize: 'none',
});
