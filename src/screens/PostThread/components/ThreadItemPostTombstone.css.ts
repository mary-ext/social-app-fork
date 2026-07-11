import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH, OUTER_SPACE } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	marginBottom: space.xs,
	paddingLeft: OUTER_SPACE,
	paddingRight: OUTER_SPACE,
	paddingTop: OUTER_SPACE / 1.2,
});

export const row = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	color: colors.textContrastMedium,
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: OUTER_SPACE / 1.2,
	paddingTop: OUTER_SPACE / 1.2,
});

export const iconCell = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	width: LINEAR_AVI_WIDTH,
});
