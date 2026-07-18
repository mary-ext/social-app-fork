import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const link = style({
	display: 'flex',
	flexDirection: 'column',
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

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const embedCard = style({
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.sm,
	borderColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	padding: space.md,
});

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
});

export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const saveButtonPlaceholder = style({
	flexShrink: 0,
	alignSelf: 'center',
	borderRadius: borderRadius.full,
	backgroundColor: vars.palette.contrast_50,
	width: 97,
	height: 33,
});

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
