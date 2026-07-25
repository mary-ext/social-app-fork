import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const container = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			gap: space.md,
			backgroundColor: colors.bg,
			paddingBlock: 18,
			paddingInline: space.xl,
		},
		variants: {
			topBorder: {
				true: {
					borderTop: `1px solid ${colors.borderContrastLow}`,
				},
			},
		},
	},
	{ debugId: 'container' },
);

export const cta = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	alignItems: 'center',
});

export const empty = style({ paddingBlock: 40 });
