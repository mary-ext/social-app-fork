import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const heightVar = createVar();

export const footer = recipe(
	{
		base: {
			alignItems: 'center',
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			height: fallbackVar(heightVar, '180px'),
			paddingBottom: space.lg,
			paddingTop: 30,
			width: '100%',
		},
		variants: {
			border: {
				false: {},
				true: {
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
		defaultVariants: { border: true },
	},
	{ debugId: 'footer' },
);

export const errorOuter = style({
	boxSizing: 'border-box',
	paddingLeft: space.lg,
	paddingRight: space.lg,
	width: '100%',
});

export const errorRow = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	padding: space.md,
});

export const errorText = style({
	flex: 1,
	minWidth: 0,
});
