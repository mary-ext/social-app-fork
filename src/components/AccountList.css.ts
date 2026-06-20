import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'none',
	border: 'none',
	color: colors.text,
	cursor: 'pointer',
	display: 'flex',
	font: 'inherit',
	gap: space.sm,
	padding: space.lg,
	textAlign: 'start',
	width: '100%',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
		'&:not(:last-child)': { borderBottom: `1px solid ${colors.borderContrastLow}` },
	},
});

// 48px circle standing in for an avatar on the "other account" row; brightens together with its row on hover.
export const addAvatar = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.full,
	color: colors.textContrastLow,
	display: 'flex',
	flexShrink: 0,
	height: 48,
	justifyContent: 'center',
	width: 48,
	selectors: {
		[`${row}:hover &`]: { backgroundColor: colors.contrast_50 },
	},
});

// nudge the badges to optically center against the display name's cap height.
export const badges = style({
	flexShrink: 0,
	marginTop: -2,
});

// the positive-tinted check marking the currently signed-in account.
export const check = style({
	alignItems: 'center',
	backgroundColor: colors.positive_500,
	borderRadius: borderRadius.full,
	color: colors.white,
	display: 'flex',
	flexShrink: 0,
	height: 20,
	justifyContent: 'center',
	width: 20,
});

export const chevron = style({
	alignItems: 'center',
	color: colors.textContrastLow,
	display: 'flex',
	flexShrink: 0,
});

export const container = style({
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.lg,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
});

// the display name + handle column; min-width 0 down the chain so the name truncates.
export const info = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
	paddingInlineEnd: space._2xl,
});

export const name = style({
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
	minWidth: 0,
});

// pending highlight (matching the hover surface) shown while an account resumes.
export const rowActive = style({
	backgroundColor: colors.contrast_25,
});
