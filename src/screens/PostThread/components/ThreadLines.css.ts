import { style } from '@vanilla-extract/css';

import { TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { OUTER_SPACE, REPLY_LINE_WIDTH } from '#/components/PostLayout.const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

// these boxes set `box-sizing: border-box` so their widths/heights are the total box, letting the borders that
// draw the spine land on the avatar centers rather than 2px outside them.

/** One per ancestor level; its right border draws that ancestor's vertical reply line. */
export const guide = style({
	borderRightColor: colors.borderContrastLow,
	borderRightStyle: 'solid',
	borderRightWidth: REPLY_LINE_WIDTH,
	boxSizing: 'border-box',
	// pin flex-shrink:0; without it the indent guides shrink on crowded rows and the post lands at the wrong
	// depth.
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
