import { style } from '@vanilla-extract/css';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const hider = style({
	backgroundColor: 'transparent',
	paddingRight: space._2xs,
	paddingLeft: 0,
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
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	paddingBottom: space.xs,
});

export const labelsOnMe = style({
	paddingBottom: space.xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});

export const deletedRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	paddingTop: space.md,
	paddingBottom: space.md,
});

export const deletedIcon = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	width: LINEAR_AVI_WIDTH,
	color: colors.textContrastMedium,
});

export const deletedSpacer = style({
	height: 4,
});
