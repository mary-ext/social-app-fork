import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, REPLY_LINE_WIDTH, TREE_AVI_WIDTH, TREE_INDENT } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'row',
});

export const connectorBase = style({
	boxSizing: 'border-box',
	borderBottomWidth: REPLY_LINE_WIDTH,
	borderLeftWidth: REPLY_LINE_WIDTH,
	borderBottomStyle: 'solid',
	borderLeftStyle: 'solid',
	borderBottomLeftRadius: borderRadius.sm,
	borderBottomColor: colors.borderContrastLow,
	borderLeftColor: colors.borderContrastLow,
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
	display: 'flex',
	flexDirection: 'row',
	flexGrow: 1,
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space.sm,
	paddingBottom: space.md,
	minWidth: 0,
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
