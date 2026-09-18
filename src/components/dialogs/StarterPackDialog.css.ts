import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { iconSize, space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const item = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			gap: space.md,
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingBlock: space.md,
			paddingInline: DIALOG_PADDING,
		},
		variants: {
			topBorder: {
				true: {
					borderTop: `1px solid ${colors.borderContrastLow}`,
				},
			},
		},
	},
	{ debugId: 'starterPackItem' },
);

export const itemInfo = style({
	flex: 1,
	minWidth: 0,
});

export const itemMeta = style({
	display: 'flex',
	alignItems: 'center',
	marginTop: space.xs,
});

export const moreCount = style({
	marginLeft: space.xs,
});

export const loading = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._5xl,
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	alignItems: 'center',
	paddingTop: space._5xl,
	paddingInline: space.xl,
});

export const emptyText = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	alignItems: 'center',
	maxWidth: 260,
});

export const starterPackIcon = style({
	width: iconSize._4xl,
	height: iconSize._4xl,
	color: colors.contrast_200,
});
