import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';

export const outer = style({
	width: '100%',
	minWidth: 280,
	maxWidth: 360,
});

export const inner = recipe(
	{
		base: {
			overflow: 'hidden',
			border: 'none',
		},
		variants: {
			fromSelf: {
				true: { background: colors.primary_50 },
				false: { background: colors.contrast_50 },
			},
		},
	},
	{ debugId: 'messageItemEmbedInner' },
);
