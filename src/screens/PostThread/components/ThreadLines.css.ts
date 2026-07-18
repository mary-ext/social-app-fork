import { style } from '@vanilla-extract/css';

import { TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { OUTER_SPACE, REPLY_LINE_WIDTH } from '#/components/PostLayout.const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const guide = style({
	boxSizing: 'border-box',
	position: 'relative',
	left: 1,
	flexShrink: 0,
	borderRightWidth: REPLY_LINE_WIDTH,
	borderRightStyle: 'solid',
	borderRightColor: colors.borderContrastLow,
	width: TREE_INDENT + TREE_AVI_WIDTH / 2,
});

export const guideSkipped = style({
	borderRightWidth: 0,
});

export const connector = style({
	boxSizing: 'border-box',
	position: 'absolute',
	top: 0,
	left: -1,
	borderBottomWidth: REPLY_LINE_WIDTH,
	borderLeftWidth: REPLY_LINE_WIDTH,
	borderBottomStyle: 'solid',
	borderLeftStyle: 'solid',
	borderBottomLeftRadius: borderRadius.sm,
	borderBottomColor: colors.borderContrastLow,
	borderLeftColor: colors.borderContrastLow,
	width: OUTER_SPACE,
	height: TREE_AVI_WIDTH / 2 + REPLY_LINE_WIDTH / 2 + OUTER_SPACE / 2,
});

export const replyChildLineColumn = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	flexShrink: 0,
	paddingTop: space._2xs,
	width: TREE_AVI_WIDTH + space.xs,
});

export const replyChildLine = style({
	boxSizing: 'border-box',
	position: 'relative',
	left: -1,
	flex: 1,
	borderRightWidth: REPLY_LINE_WIDTH,
	borderRightStyle: 'solid',
	borderRightColor: colors.borderContrastLow,
	width: '50%',
});
