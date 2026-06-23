import { style } from '@vanilla-extract/css';

import { TREE_AVI_WIDTH } from '#/screens/PostThread/const';

import { OUTER_SPACE } from '#/components/PostLayout.const';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

/**
 * Vertical body padding. The boundary between two root-level reply subtrees (where the outer row border sits)
 * gets the looser value on both sides — `LOOSE` top on the bordered post that opens a subtree, `LOOSE` bottom
 * on the last child that closes the one above. Everywhere else uses `TIGHT`.
 */
const PADDING_TIGHT = 8;
const PADDING_LOOSE = 12;

/**
 * Tree-thread layout. The reply lines (indent guides, connector, child line) live in `./ThreadLines`; this
 * file owns the indented row structure, body columns, and deleted-post chrome. The tree's layout is
 * row-oriented and avatar-in-meta, so it doesn't share `#/components/PostLayout`'s column primitives.
 */

/** The post row; GalleryBleed measures this host and clips the image-carousel bleed to it. */
export const outerRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
});

/** Top border on a root-level reply with no parent reply line above it. */
export const outerRowBorder = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
});

/** Margin on the PostHider icon circle on the tree thread surface. */
export const hiderIcon = style({
	marginLeft: 2,
	marginRight: 2,
});

export const labelsOnMe = style({
	paddingBottom: space._2xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});

// #region wrappers
/** The flex-1 column to the right of the indent spine. `position: relative` anchors the connector. */
export const innerWrapper = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	// restate min-width:0 down the whole width chain so a wide embed (image gallery) stays clamped to the row
	// instead of growing the column unbounded.
	minWidth: 0,
	paddingTop: PADDING_TIGHT,
	paddingInline: 16,
	position: 'relative',
});

/** Looser top padding on a post that opens a root-level subtree (the one carrying the outer row border). */
export const innerWrapperBordered = style({
	paddingTop: PADDING_LOOSE,
});

/**
 * The post hover target; tints translucently behind content so text stays crisp. Sits inside the
 * (overflow-clipped) GalleryBleed row as `flex: 1`, so it needs `min-width: 0` — otherwise it grows to the
 * gallery's intrinsic width, which the bleed re-measures and feeds back into an unbounded width loop.
 */
export const hoverable = style({
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});
// #endregion

// #region post body
export const bodyColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const bodyRow = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	minWidth: 0,
});

/** `minWidth: 0` lets the clamped text ellipsize. */
export const contentColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	paddingLeft: space._2xs,
	paddingBottom: PADDING_TIGHT,
});

/** Looser bottom padding on the last child of a branch, which closes a root-level subtree. */
export const contentColumnLastChild = style({
	paddingBottom: PADDING_LOOSE,
});

// #endregion

// #region deleted
export const deletedRow = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	boxSizing: 'border-box',
	// the trash icon inherits this via `fill="currentColor"`
	color: colors.text,
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	height: TREE_AVI_WIDTH,
	paddingLeft: OUTER_SPACE / 2,
	paddingRight: OUTER_SPACE / 2,
});

export const deletedText = style({
	marginTop: space._2xs,
});

export const deletedSpacer = style({
	height: OUTER_SPACE / 2,
});

/** Loading-skeleton box: a flat 16px-horizontal / 12px-vertical pad, since the skeleton has no indent guides. */
export const skeleton = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: space.md,
	paddingInline: OUTER_SPACE,
});

// #endregion
