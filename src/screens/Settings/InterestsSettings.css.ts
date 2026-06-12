import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	paddingBlock: space.lg,
	paddingInline: space.lg,
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const loaderWrap = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	padding: space.lg,
});

export const chipWrap = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.sm,
});

export const chip = style({
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: 'none',
	borderRadius: 999,
	cursor: 'pointer',
	paddingBlock: space.md,
	paddingInline: space.xl,
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_100 },
		'&[data-checked]': { backgroundColor: vars.palette.contrast_900 },
		'&[data-checked]:hover': { backgroundColor: vars.palette.contrast_975 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const chipText = style({
	color: vars.palette.contrast_900,
	selectors: {
		'[data-checked] &': { color: vars.palette.contrast_25 },
	},
});
