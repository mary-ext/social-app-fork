import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const link = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
});

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	width: '100%',
});

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'flex-start',
	width: '100%',
});

export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const embedCard = style({
	boxSizing: 'border-box',
	transitionProperty: 'border-color',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.sm,
	borderColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	width: '100%',
	overflow: 'hidden',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
		'&:hover': { borderColor: colors.borderContrastHigh },
	},
});

export const embedBody = style({
	boxSizing: 'border-box',
	padding: space.md,
	width: '100%',
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
