import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const root = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			gap: space.xl,
			paddingBlock: space._3xl,
			paddingInline: space._2xl,
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

export const buttons = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	justifyContent: 'center',
});
