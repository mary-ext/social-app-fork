import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const hider = style({
	backgroundColor: 'transparent',
	paddingLeft: 0,
	paddingRight: space._2xs,
});

export const hiderIcon = style({
	marginRight: space.xs,
});

export const parentLineRow = style({
	display: 'flex',
	flexDirection: 'row',
	height: 12,
});

export const parentLineColumn = style({
	display: 'flex',
	flexDirection: 'column',
	width: LINEAR_AVI_WIDTH,
});

export const parentLine = style({
	marginBottom: space.xs,
});

export const childLine = style({
	marginTop: space.xs,
});

export const metaSpacing = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: space.xs,
});

export const labelsOnMe = style({
	paddingBottom: space.xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});

export const deletedRow = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: space.md,
	paddingTop: space.md,
});

export const deletedIcon = style({
	alignItems: 'center',
	color: colors.textContrastMedium,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	width: LINEAR_AVI_WIDTH,
});

export const deletedSpacer = style({
	height: 4,
});
