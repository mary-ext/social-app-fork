import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = recipe(
	{
		base: {
			borderWidth: 1,
			borderStyle: 'solid',
			borderRadius: borderRadius.sm,
			borderColor: colors.borderContrastLow,
			backgroundColor: colors.bg,
			padding: space.md,
		},
		variants: {
			interactive: {
				true: {
					selectors: {
						'&:hover': { borderColor: vars.palette.contrast_300 },
					},
				},
			},
		},
	},
	{ debugId: 'card' },
);

export const revealedPad = style({
	paddingTop: 4,
});
