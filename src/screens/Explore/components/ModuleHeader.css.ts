import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const container = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			alignItems: 'center',
			backgroundColor: colors.bg,
			paddingTop: space._2xl,
			paddingBottom: space.md,
			paddingInline: space.lg,
		},
		defaultVariants: { bottomBorder: false },
		variants: {
			bottomBorder: {
				false: {},
				true: { borderBottom: `1px solid ${colors.borderContrastLow}` },
			},
		},
	},
	{ debugId: 'container', layer: components },
);

export const iconSizeVar = createVar();

export const icon = style({
	flexShrink: 0,
	marginLeft: -2,
	width: iconSizeVar,
	height: iconSizeVar,
});

export const titleText = style({
	flex: 1,
	minWidth: 0,
});

export const subtitleText = style({
	flex: 1,
	minWidth: 0,
});

export const searchButton = style({
	flexShrink: 0,
	marginRight: -4,
});

export const pinButton = style({
	flexShrink: 0,
	marginRight: -4,
});

export const feedLink = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: 10,
	alignItems: 'center',
	marginLeft: -6,
	borderRadius: borderRadius.md,
	padding: space.xs,
	minWidth: 0,
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
	':hover': {
		backgroundColor: colors.contrast_25,
	},
});
