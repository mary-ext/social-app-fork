import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const container = recipe(
	{
		base: {
			alignItems: 'center',
			backgroundColor: colors.bg,
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			paddingBottom: space.md,
			paddingInline: space.lg,
			paddingTop: space._2xl,
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

/** Icon box edge length in px, wired inline so it scales to the `size` prop. */
export const iconSizeVar = createVar();

export const icon = style({
	flexShrink: 0,
	height: iconSizeVar,
	marginLeft: -2,
	width: iconSizeVar,
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
	alignItems: 'center',
	borderRadius: borderRadius.md,
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: 10,
	marginLeft: -6,
	minWidth: 0,
	padding: space.xs,
	textDecoration: 'none',
	':hover': {
		backgroundColor: colors.contrast_25,
	},
});
