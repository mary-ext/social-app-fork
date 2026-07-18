import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const root = recipe(
	{
		base: {
			backgroundColor: colors.contrast_25,
			padding: space.sm,
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

export const card = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.sm,
	backgroundColor: colors.bg,
	padding: space.md,
});

export const icon = style({
	margin: (20 - 18) / 2,
});

export const text = style({
	flex: 1,
	minWidth: 0,
});
