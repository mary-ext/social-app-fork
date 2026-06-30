import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const root = recipe(
	{
		base: {
			alignItems: 'center',
			cursor: 'pointer',
			display: 'flex',
			flexDirection: 'row',
			gap: space.md,
			paddingBlock: space.md,
			paddingInline: space.lg,
			position: 'relative',

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
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	inset: 0,
	margin: 0,
	outline: 'none',
	padding: 0,
	position: 'absolute',
	zIndex: 1,
});

export const body = style({
	flexGrow: 1,
	minWidth: 0,
});

export const imageButton = style({
	color: colors.contrast_500,
	marginRight: -6,
	position: 'relative',
	zIndex: 2,

	selectors: {
		'&:active': { color: colors.primary_500 },
		'&:focus-visible': { color: colors.primary_500 },
		'&:hover': { color: colors.primary_500 },
	},
});
