import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

export const field = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: 8,
	alignItems: 'center',
	border: '1px solid transparent',
	borderRadius: 10,
	backgroundColor: vars.palette.contrast_50,
	paddingInline: 12,
	width: '100%',
	cursor: 'text',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_100 },
		'&:has(input:focus)': { borderColor: vars.palette.primary_500, backgroundColor: vars.palette.primary_25 },
	},
});

export const icon = style({
	flexShrink: 0,
	color: vars.palette.contrast_500,
	pointerEvents: 'none',
	selectors: {
		[`${field}:hover &`]: { color: vars.palette.contrast_800 },
		[`${field}:has(input:focus) &`]: { color: vars.palette.primary_500 },
	},
});

export const input = style({
	appearance: 'none',
	flex: 1,
	margin: 0,
	outline: 'none',
	border: 'none',
	backgroundColor: 'transparent',
	paddingBlock: 10,
	paddingInline: 0,
	minWidth: 0,
	lineHeight: roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`),
	color: vars.palette.contrast_1000,
	fontFamily: 'inherit',
	fontSize: fontSize.md,
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
	display: 'flex',
	flexShrink: 0,
	gap: 4,
	alignItems: 'center',
	marginInlineEnd: -6,
});
