import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'row',
});

// #region tree indent spine
export const guide = style({
	borderRightColor: colors.borderContrastLow,
	borderRightStyle: 'solid',
	borderRightWidth: REPLY_LINE_WIDTH,
	// border-box + no-shrink so the indent matches the tree posts above; see ThreadItemTreePost.css
	boxSizing: 'border-box',
	flexShrink: 0,
	left: 1,
	position: 'relative',
	width: TREE_INDENT + TREE_AVI_WIDTH / 2,
});

export const guideSkipped = style({
	borderRightWidth: 0,
});
// #endregion

/** The L-shaped elbow that drops the spine into the "read more" link. */
export const connectorBase = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomLeftRadius: borderRadius.sm,
	borderBottomStyle: 'solid',
	borderBottomWidth: REPLY_LINE_WIDTH,
	borderLeftColor: colors.borderContrastLow,
	borderLeftStyle: 'solid',
	borderLeftWidth: REPLY_LINE_WIDTH,
	boxSizing: 'border-box',
	height: 18, // magic, the Link beside it is 38px tall
});

export const connectorTree = style({
	marginLeft: TREE_INDENT + TREE_AVI_WIDTH / 2 - 1,
	width: TREE_INDENT,
});

export const connectorLinear = style({
	marginLeft: (LINEAR_AVI_WIDTH - REPLY_LINE_WIDTH) / 2 + 16,
	width: LINEAR_AVI_WIDTH / 2 + 10,
});

export const underline = style({
	textDecorationLine: 'underline',
});
