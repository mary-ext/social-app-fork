import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const rowTop = style({
	alignItems: 'center',
});

export const iconColumn = style({
	width: LINEAR_AVI_WIDTH,
});

/** The short stub of reply line dropping down from the "continue thread" row. */
export const lineStub = style({
	backgroundColor: colors.borderContrastMedium,
	height: OUTER_SPACE / 2,
	width: REPLY_LINE_WIDTH,
});

export const link = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingLeft: OUTER_SPACE,
	paddingRight: OUTER_SPACE,
	paddingTop: OUTER_SPACE,
	textDecorationLine: 'none',
});

export const icon = style({
	color: colors.textContrastMedium,
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
