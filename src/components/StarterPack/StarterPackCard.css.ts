import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const link = style({
	alignItems: 'flex-start',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	textDecoration: 'none',
});

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	width: '100%',
});

export const header = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	width: '100%',
});

// the name/byline stack; min-width:0 lets the clamped text shrink inside the flex row instead of overflowing.
export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

// the OG-image embed variant's anchor: a bordered card whose border lightens on hover, matching the sibling
// external-link embed. inset focus ring so the post body's `GalleryBleed` clip can't trim it.
export const embedCard = style({
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.sm,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	overflow: 'hidden',
	transitionProperty: 'border-color',
	width: '100%',
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

/**
 * A list-row starter pack card: full-width padded row that highlights on hover/press, with a hairline top
 * separator on by default — opt out (`topBorder: false`) for the first row beneath a sticky tab bar.
 */
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

/**
 * A non-interactive loading row: same padding and top separator as {@link defaultRow}, but without the
 * hover/active highlight (a placeholder isn't a press target).
 */
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
