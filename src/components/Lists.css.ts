import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const heightVar = createVar();

export const footer = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			paddingTop: 30,
			paddingBottom: space.lg,
			width: '100%',
			height: fallbackVar(heightVar, '180px'),
		},
		variants: {
			border: {
				false: {},
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
				},
			},
		},
		defaultVariants: { border: true },
	},
	{ debugId: 'footer' },
);

export const errorOuter = style({
	boxSizing: 'border-box',
	paddingRight: space.lg,
	paddingLeft: space.lg,
	width: '100%',
});

export const errorRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	padding: space.md,
});

export const errorText = style({
	flex: 1,
	minWidth: 0,
});
