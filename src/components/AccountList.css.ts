import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const row = style({
	appearance: 'none',
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
	border: 'none',
	background: 'none',
	padding: space.lg,
	width: '100%',
	textAlign: 'start',
	color: colors.text,
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
		'&:not(:last-child)': { borderBottom: `1px solid ${colors.borderContrastLow}` },
	},
});

export const addAvatar = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	width: 48,
	height: 48,
	color: colors.textContrastLow,
	selectors: {
		[`${row}:hover &`]: { backgroundColor: colors.contrast_50 },
	},
});

export const badges = style({
	flexShrink: 0,
	marginTop: -2,
});

export const check = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.full,
	backgroundColor: colors.positive_500,
	width: 20,
	height: 20,
	color: colors.white,
});

export const chevron = style({
	flexShrink: 0,
});

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.lg,
	overflow: 'hidden',
});

export const info = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	paddingInlineEnd: space._2xl,
	minWidth: 0,
});

export const name = style({
	minWidth: 0,
});

export const nameRow = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
	minWidth: 0,
});

export const rowActive = style({
	backgroundColor: colors.contrast_25,
});
