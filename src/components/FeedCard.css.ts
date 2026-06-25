import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

/** Vertical card link: stacks the header, description, and like count. */
export const link = style({
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	textDecoration: 'none',
});

/**
 * The `Default` presentation: a padded, full-width row that highlights on hover/press, with a hairline top
 * separator on by default — opt out (`topBorder: false`) for the first row beneath a header.
 */
export const defaultRow = recipe({
	base: {
		padding: space.lg,
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
});

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	width: '100%',
});

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

/** Title + byline column; `minWidth: 0` lets the single-line text truncate instead of overrunning the row. */
export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});
