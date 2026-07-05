import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

/** A saved-feed row in the feeds list; highlights on hover/press, replacing the old pressable's render-prop. */
export const savedFeedRow = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	flex: 1,
	paddingBlock: space.md,
	paddingInline: space.lg,
	selectors: {
		'&:active': { backgroundColor: colors.contrast_25 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

/**
 * The Following timeline row and the loading placeholders: same box as {@link savedFeedRow} but inert (no
 * press, no highlight).
 */
export const plainRow = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

/** Wraps a non-row section (the empty-state CTAs) with the list's hairline bottom separator. */
export const borderedSection = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
});

/** Compact section header — a small primary glyph beside a heading, mirroring the Explore module headers. */
export const sectionHeader = recipe(
	{
		base: {
			alignItems: 'center',
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			paddingBottom: space.md,
			paddingInline: space.lg,
			paddingTop: space._2xl,
		},
		defaultVariants: { bottomBorder: false, first: false },
		variants: {
			bottomBorder: {
				true: { borderBottom: `1px solid ${colors.borderContrastLow}` },
			},
			// the leading header sits directly under the nav bar, so it takes a tighter top gap
			first: {
				true: { paddingTop: space.lg },
			},
		},
	},
	{ debugId: 'sectionHeader' },
);

/** Nudges the header glyph flush with the content edge and keeps it from shrinking. */
export const sectionHeaderIcon = style({
	flexShrink: 0,
	marginLeft: -2,
});

/** Header heading; `minWidth: 0` lets it truncate instead of overrunning the row. */
export const sectionHeaderTitle = style({
	flex: 1,
	minWidth: 0,
});

/** The small square badge holding the Following row's timeline glyph. */
export const followingIcon = style({
	alignItems: 'center',
	backgroundColor: colors.primary_500,
	borderRadius: 3,
	display: 'flex',
	flexShrink: 0,
	height: 28,
	justifyContent: 'center',
	width: 28,
});

/**
 * Search-field row beneath the Discover header; `scroll-margin-top` clears the sticky header when focus
 * scrolls it into view.
 */
export const searchWrapper = style({
	paddingBottom: space.xs,
	paddingInline: space.lg,
	scrollMarginTop: 56,
});

/** Empty-search message block. */
export const noResults = style({
	paddingBlock: 10,
	paddingBottom: space._5xl,
	paddingInline: space.lg,
});
