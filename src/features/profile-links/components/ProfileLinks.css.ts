import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const lone = style({
	display: 'flex',
	flexDirection: 'row',
});

export const row = recipe(
	{
		base: {
			display: 'flex',
			position: 'relative',
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: space.sm,
			alignItems: 'center',
			minWidth: 0,
		},
		variants: {
			// hide the initial layout until the collapsed row has been measured.
			measured: { false: { visibility: 'hidden' }, true: {} },
		},
	},
	{ debugId: 'row' },
);

export const item = recipe(
	{
		base: {
			display: 'flex',
			maxWidth: '100%',
			minWidth: 0,
		},
		variants: {
			// out of flow but still measurable
			folded: {
				false: {},
				true: { position: 'absolute', top: 0, left: 0, visibility: 'hidden' },
			},
		},
	},
	{ debugId: 'item' },
);

// same metrics as a link pill
export const more = style({
	paddingBlock: 6,
	paddingRight: 12,
	paddingLeft: 10,
	color: colors.text,
});
