import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const avatarRow = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
});

export const buttonRow = style({
	alignItems: 'center',
	display: 'flex',
	flexWrap: 'wrap',
	gap: space._2xl,
	justifyContent: 'center',
	paddingTop: space._2xl,
});

export const createdAt = style({
	display: 'block',
	paddingInline: space.xl,
	paddingTop: space.xs,
});

export const groupName = style({
	display: 'block',
	paddingTop: space.lg,
});

export const headerBlock = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	paddingBlock: space._4xl,
	paddingInline: space.xl,
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	justifyContent: 'center',
});

export const scroller = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	scrollbarColor: `${colors.contrast_100} transparent`,
	scrollbarWidth: 'thin',
});
