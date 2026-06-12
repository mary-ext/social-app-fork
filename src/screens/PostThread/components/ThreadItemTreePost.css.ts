import { style } from '@vanilla-extract/css';

import { OUTER_SPACE, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

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

// #region indent spine
// these boxes set `box-sizing: border-box` so their widths/heights are the total box, letting the borders
// that draw the spine land on the avatar centers rather than 2px outside them.
/** One per ancestor level; its right border draws that ancestor's vertical reply line. */
export const guide = style({
	borderRightColor: colors.borderContrastLow,
	borderRightStyle: 'solid',
	borderRightWidth: REPLY_LINE_WIDTH,
	boxSizing: 'border-box',
	// pin flex-shrink:0; without it the indent guides shrink on crowded rows and the post lands at the
	// wrong depth.
	flexShrink: 0,
	left: 1,
	position: 'relative',
	width: TREE_INDENT + TREE_AVI_WIDTH / 2,
});

/** A level whose ancestor branch has ended — keeps the indent width but draws no line. */
export const guideSkipped = style({
	borderRightWidth: 0,
});

/** The L-shaped connector from the parent's spine into this post (indent > 1). */
export const connector = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomLeftRadius: borderRadius.sm,
	borderBottomStyle: 'solid',
	borderBottomWidth: REPLY_LINE_WIDTH,
	borderLeftColor: colors.borderContrastLow,
	borderLeftStyle: 'solid',
	borderLeftWidth: REPLY_LINE_WIDTH,
	boxSizing: 'border-box',
	height: TREE_AVI_WIDTH / 2 + REPLY_LINE_WIDTH / 2 + OUTER_SPACE / 2,
	left: -1,
	position: 'absolute',
	top: 0,
	width: OUTER_SPACE,
});

/** The outgoing child reply line below this post's inline avatar. */
export const replyChildLineColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	// fixed-width gutter aligning the child line under the inline avatar; must not shrink.
	flexShrink: 0,
	paddingTop: space._2xs,
	position: 'relative',
	width: TREE_AVI_WIDTH + space.xs,
});

export const replyChildLine = style({
	borderRightColor: colors.borderContrastLow,
	borderRightStyle: 'solid',
	borderRightWidth: REPLY_LINE_WIDTH,
	boxSizing: 'border-box',
	flex: 1,
	left: -1,
	position: 'relative',
	width: '50%',
});
// #endregion

// #region wrappers
/** The flex-1 column to the right of the indent spine. `position: relative` anchors the connector. */
export const innerWrapper = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	// restate min-width:0 down the whole width chain so a wide embed (image gallery) stays clamped to the
	// row instead of growing the column unbounded.
	minWidth: 0,
	paddingLeft: OUTER_SPACE,
	paddingRight: OUTER_SPACE,
	position: 'relative',
});

export const innerWrapperPadTop = style({
	paddingTop: OUTER_SPACE / 2,
});

/** The looser top padding the first post in a group takes when it has no incoming parent line. */
export const innerWrapperPadTopLoose = style({
	paddingTop: OUTER_SPACE / 1.5,
});

export const innerWrapperPadBottom = style({
	paddingBottom: OUTER_SPACE / 2,
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
});

export const embed = style({
	paddingBottom: space.xs,
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
// #endregion
