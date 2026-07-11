import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

export const field = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	border: '1px solid transparent',
	borderRadius: 10,
	boxSizing: 'border-box',
	cursor: 'text',
	display: 'flex',
	gap: 8,
	paddingInline: 12,
	width: '100%',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_100 },
		'&:has(input:focus)': { backgroundColor: vars.palette.primary_25, borderColor: vars.palette.primary_500 },
	},
});

export const icon = style({
	color: vars.palette.contrast_500,
	flexShrink: 0,
	pointerEvents: 'none',
	selectors: {
		[`${field}:hover &`]: { color: vars.palette.contrast_800 },
		[`${field}:has(input:focus) &`]: { color: vars.palette.primary_500 },
	},
});

export const input = style({
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	color: vars.palette.contrast_1000,
	flex: 1,
	fontFamily: 'inherit',
	fontSize: fontSize.md,
	lineHeight: roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`),
	margin: 0,
	minWidth: 0,
	outline: 'none',
	paddingBlock: 10,
	paddingInline: 0,
	selectors: {
		'&::placeholder': { color: vars.palette.contrast_500, userSelect: 'none' },
	},
});

export const clear = style({
	flexShrink: 0,
	selectors: {
		[`${field} > &`]: { marginInlineEnd: -6 },
	},
});

export const slot = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	gap: 4,
	marginInlineEnd: -6,
});
