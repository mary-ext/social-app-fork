import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const avatarRow = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
});

export const buttonRow = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: space._2xl,
	alignItems: 'center',
	justifyContent: 'center',
	paddingTop: space._2xl,
});

export const createdAt = style({
	display: 'block',
	paddingTop: space.xs,
	paddingInline: space.xl,
});

export const groupName = style({
	display: 'block',
	paddingTop: space.lg,
});

export const headerBlock = style({
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: colors.borderContrastLow,
	paddingBlock: space._4xl,
	paddingInline: space.xl,
});

export const loading = style({
	display: 'flex',
	flex: 1,
	alignItems: 'center',
	justifyContent: 'center',
});

export const scroller = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	scrollbarWidth: 'thin',
	scrollbarColor: `${colors.contrast_100} transparent`,
});
