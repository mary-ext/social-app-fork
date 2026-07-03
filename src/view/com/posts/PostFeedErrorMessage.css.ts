import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const container = recipe(
	{
		base: {
			backgroundColor: colors.bg,
			display: 'flex',
			flexDirection: 'column',
			gap: space.md,
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
});

export const empty = style({ paddingBlock: 40 });
