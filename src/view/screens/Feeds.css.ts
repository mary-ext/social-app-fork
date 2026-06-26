import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

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

/** "My Feeds" section header — icon + heading column, closed off with a bottom separator. */
export const savedHeader = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	paddingBlock: space.lg,
	paddingInline: space.md,
});

/** "Discover New Feeds" section header — sits directly above the search field, so no bottom separator. */
export const aboutHeader = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	paddingBlock: space.lg,
	paddingInline: space.md,
});

/**
 * Title + subtitle column of the "My Feeds" header. `minWidth: 0` lets the heading truncate instead of
 * overrunning.
 */
export const headerColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.xs,
	minWidth: 0,
});

/** Title + subtitle column of the "Discover" header — slightly looser spacing than {@link headerColumn}. */
export const aboutColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.sm,
	minWidth: 0,
});

/** The tinted circle behind a section-header icon (replaces the old `IconCircle` at its `lg` size). */
export const headerIcon = style({
	alignItems: 'center',
	backgroundColor: colors.primary_50,
	borderRadius: borderRadius.full,
	display: 'flex',
	flexShrink: 0,
	height: 52,
	justifyContent: 'center',
	width: 52,
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
	paddingInline: space.md,
	scrollMarginTop: 56,
});

/** Empty-search message block. */
export const noResults = style({
	paddingBlock: 10,
	paddingBottom: space._5xl,
	paddingInline: space.lg,
});
