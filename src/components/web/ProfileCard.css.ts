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
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	textDecoration: 'none',
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
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
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
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
	},
	{ debugId: 'loadingRow' },
);

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const nameAndHandle = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const handleRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	maxWidth: '100%',
});

export const handleText = style({
	alignSelf: 'flex-start',
	flexShrink: 1,
});

export const badges = style({
	paddingLeft: 6,

	':empty': {
		display: 'none',
	},
});

export const inlineRow = style({
	alignItems: 'flex-end',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
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
