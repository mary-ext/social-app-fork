import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.md,
	width: '100%',
});

export const link = style({
	display: 'flex',
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
});

export const defaultRow = recipe(
	{
		base: {
			paddingBlock: space.md,
			paddingInline: space.lg,
			selectors: {
				'&:active': { backgroundColor: colors.contrast_25 },
				'&:hover': { backgroundColor: colors.contrast_25 },
			},
		},
		defaultVariants: { topBorder: true },
		variants: {
			topBorder: {
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
				},
			},
		},
	},
	{ debugId: 'defaultRow' },
);

export const loadingRow = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			gap: space.md,
			paddingBlock: space.md,
			paddingInline: space.lg,
		},
		variants: {
			topBorder: {
				true: {
					borderTopWidth: 1,
					borderTopStyle: 'solid',
					borderTopColor: colors.borderContrastLow,
				},
			},
		},
	},
	{ debugId: 'loadingRow' },
);

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
});

export const nameAndHandle = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const handleRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	maxWidth: '100%',
});

export const handleText = style({
	flexShrink: 1,
	alignSelf: 'flex-start',
});

export const badges = style({
	paddingLeft: 6,

	':empty': {
		display: 'none',
	},
});

export const inlineRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	alignItems: 'flex-end',
});

export const inlineName = style({
	flexShrink: 0,
	maxWidth: '70%',
});

export const inlineBadges = style({
	alignSelf: 'center',
	paddingLeft: space._2xs,
});

export const inlineHandle = style({
	flexShrink: 10,
});

export const labels = style({
	paddingTop: space.xs,
});
