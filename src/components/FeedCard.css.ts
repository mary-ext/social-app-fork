import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const link = style({
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
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

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const embedCard = style({
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.sm,
	borderStyle: 'solid',
	borderWidth: 1,
	padding: space.md,
});

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const saveButtonPlaceholder = style({
	alignSelf: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: borderRadius.full,
	flexShrink: 0,
	height: 33,
	width: 97,
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
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
	},
	{ debugId: 'loadingRow' },
);
