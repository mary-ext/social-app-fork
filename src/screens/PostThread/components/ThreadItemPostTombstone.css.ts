import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, OUTER_SPACE } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	marginBottom: space.xs,
	paddingTop: OUTER_SPACE / 1.2,
	paddingRight: OUTER_SPACE,
	paddingLeft: OUTER_SPACE,
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	paddingTop: OUTER_SPACE / 1.2,
	paddingBottom: OUTER_SPACE / 1.2,
	color: colors.textContrastMedium,
});

export const iconCell = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	width: LINEAR_AVI_WIDTH,
});
