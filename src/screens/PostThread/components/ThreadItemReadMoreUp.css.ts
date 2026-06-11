import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, OUTER_SPACE, REPLY_LINE_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const rowTop = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const iconCell = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	width: LINEAR_AVI_WIDTH,
});

/** The short stub of reply line dropping down from the "continue thread" row. */
export const lineStub = style({
	backgroundColor: colors.borderContrastLow,
	height: OUTER_SPACE / 2,
	marginTop: space.xs,
	width: REPLY_LINE_WIDTH,
});

export const underline = style({
	textDecorationLine: 'underline',
});
