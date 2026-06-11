import { style } from '@vanilla-extract/css';

import { OUTER_SPACE, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

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
/** One per ancestor level; its right border draws that ancestor's vertical reply line. */
export const guide = style({
	borderRightColor: colors.borderContrastLow,
	borderRightStyle: 'solid',
	borderRightWidth: REPLY_LINE_WIDTH,
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
	height: TREE_AVI_WIDTH / 2 + REPLY_LINE_WIDTH / 2 + OUTER_SPACE / 2,
	left: -1,
	position: 'absolute',
	top: 0,
	width: OUTER_SPACE,
});

/** The outgoing child reply line below this post's inline avatar. */
export const replyChildLineColumn = style({
	display: 'flex',
	flexDirection: 'column',
	paddingTop: space._2xs,
	position: 'relative',
	width: TREE_AVI_WIDTH + space.xs,
});

export const replyChildLine = style({
	borderRightColor: colors.borderContrastLow,
	borderRightStyle: 'solid',
	borderRightWidth: REPLY_LINE_WIDTH,
	flex: 1,
	left: -1,
	position: 'relative',
	width: '50%',
});
// #endregion

// #region wrappers
/** The flex-1 column to the right of the indent spine. `position: relative` anchors the connector. */
export const innerWrapper = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
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

/** Hosts the `SubtleHover` overlay (`position: absolute; inset: 0`), which anchors to this box. */
export const hoverWrapper = style({
	cursor: 'pointer',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	position: 'relative',
});
// #endregion

// #region post body
export const bodyColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
});

export const bodyRow = style({
	display: 'flex',
	flexDirection: 'row',
});

/** `minWidth: 0` (which RNW flex nodes defaulted to) lets the clamped text ellipsize. */
export const contentColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	paddingLeft: space._2xs,
});

/** `display: flex` so the post-text strut doesn't push the embed below down a few px. */
export const richText = style({
	display: 'flex',
	flexDirection: 'column',
	marginBottom: space._2xs,
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
