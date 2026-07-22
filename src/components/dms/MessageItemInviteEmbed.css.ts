import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const outer = recipe(
	{
		base: {
			width: '100%',
			minWidth: 280,
			maxWidth: 360,
		},
		variants: {
			indent: {
				true: { marginLeft: space.sm },
			},
		},
	},
	{ debugId: 'messageInviteEmbedOuter' },
);

export const inner = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			gap: space.md,
			padding: space.md,
			overflow: 'hidden',
		},
		variants: {
			fromSelf: {
				true: { background: colors.primary_50 },
				false: { background: colors.contrast_50 },
			},
		},
	},
	{ debugId: 'messageInviteEmbedInner' },
);

export const loadingPad = style({
	paddingBlock: 16,
});

export const errorPad = style({
	paddingBlock: 8,
});
