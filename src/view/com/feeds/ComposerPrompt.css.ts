import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const root = recipe(
	{
		base: {
			display: 'flex',
			position: 'relative',
			flexDirection: 'row',
			gap: space.md,
			alignItems: 'center',
			paddingBlock: space.md,
			paddingInline: space.lg,
			cursor: 'pointer',

			':hover': { backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover) },
		},
		defaultVariants: {
			topBorder: false,
		},
		variants: {
			topBorder: {
				true: {
					borderTop: `1px solid ${colors.borderContrastLow}`,
				},
			},
		},
	},
	{ debugId: 'root' },
);

export const cover = style({
	appearance: 'none',
	position: 'absolute',
	inset: 0,
	zIndex: 1,
	margin: 0,
	border: 'none',
	background: 'transparent',
	padding: 0,
	cursor: 'pointer',

	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
	},
});

export const body = style({
	flexGrow: 1,
	minWidth: 0,
});

export const imageButton = style({
	position: 'relative',
	zIndex: 2,
	marginRight: -6,
	color: colors.contrast_500,

	selectors: {
		'&:active': { color: colors.primary_500 },
		'&:focus-visible': { color: colors.primary_500 },
		'&:hover': { color: colors.primary_500 },
	},
});
