import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { iconSize, space } from '#/styles/tokens.css';

export const outer = style({
	padding: space.md,
	paddingBottom: `calc(${space.md}px + env(safe-area-inset-bottom, 0px))`,
});

export const card = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.contrast_50,
			padding: space.lg,
		},
		defaultVariants: { shape: 'pill' },
		variants: {
			shape: {
				banner: {},
				pill: { borderRadius: 40 },
			},
		},
	},
	{ debugId: 'chat-disabled-card' },
);

export const warningIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.negative_600,
	marginBottom: space.xs,
});

export const title = style({ marginBottom: space.xs });

export const appealButton = style({ marginTop: space.lg, width: '100%' });
