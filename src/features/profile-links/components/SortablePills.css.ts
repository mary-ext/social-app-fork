import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';

const GAP = 8;

export const row = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: GAP,
});

export const item = recipe(
	{
		base: {
			display: 'flex',
			position: 'relative',
			maxWidth: '100%',
			cursor: 'grab',
		},
		variants: {
			dragging: { false: {}, true: { opacity: 0.4 } },
		},
	},
	{ debugId: 'item' },
);

export const indicator = recipe(
	{
		base: {
			position: 'absolute',
			insetBlock: 0,
			zIndex: 1,
			borderRadius: 1,
			backgroundColor: colors.primary_500,
			width: 2,
			pointerEvents: 'none',
		},
		variants: {
			edge: {
				left: { left: -(GAP / 2) - 1 },
				right: { right: -(GAP / 2) - 1 },
			},
		},
	},
	{ debugId: 'indicator' },
);
