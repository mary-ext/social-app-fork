import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'row',
});

export const connectorBase = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomLeftRadius: borderRadius.sm,
	borderBottomStyle: 'solid',
	borderBottomWidth: REPLY_LINE_WIDTH,
	borderLeftColor: colors.borderContrastLow,
	borderLeftStyle: 'solid',
	borderLeftWidth: REPLY_LINE_WIDTH,
	boxSizing: 'border-box',
	height: 18,
});

export const connectorTree = style({
	marginLeft: TREE_INDENT + TREE_AVI_WIDTH / 2 - 1,
	width: TREE_INDENT,
});

export const connectorLinear = style({
	marginLeft: (LINEAR_AVI_WIDTH - REPLY_LINE_WIDTH) / 2 + 16,
	width: LINEAR_AVI_WIDTH / 2 + 10,
});

export const link = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	flexGrow: 1,
	minWidth: 0,
	gap: space.sm,
	paddingBottom: space.md,
	paddingTop: space.sm,
	textDecorationLine: 'none',
});

export const icon = style({
	color: colors.textContrastLow,
	selectors: {
		[`${link}:hover &`]: {
			color: colors.textContrastHigh,
		},
		[`${link}:focus-visible &`]: {
			color: colors.textContrastHigh,
		},
	},
});

export const text = style({
	selectors: {
		[`${link}:hover &`]: {
			textDecorationLine: 'underline',
		},
		[`${link}:focus-visible &`]: {
			textDecorationLine: 'underline',
		},
	},
});
