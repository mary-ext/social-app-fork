import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover, hoverWithin } from '#/styles/interaction';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

const avatarSize = 40;

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.md,
	alignItems: 'center',
	padding: space.lg,
	width: '100%',
	textAlign: 'start',
	selectors: {
		'&:not(:last-child)': { borderBottom: `1px solid ${colors.borderContrastLow}` },
	},
});

export const rowInteractive = style({
	appearance: 'none',
	border: 'none',
	background: 'none',
	color: colors.text,
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: colors.contrast_25 },
	},
});

export const addAvatar = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	width: avatarSize,
	height: avatarSize,
	color: colors.textContrastLow,
	selectors: {
		[hoverWithin(rowInteractive)]: {
			backgroundColor: colors.contrast_50,
		},
	},
});

export const addLabel = style({
	flex: 1,
	minWidth: 0,
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
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.textContrastLow,
	flexShrink: 0,
});

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.lg,
	overflow: 'hidden',
});

export const rowActive = style({
	backgroundColor: colors.contrast_25,
});

export const addIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
});

export const checkIcon = style({
	width: iconSize.xs,
	height: iconSize.xs,
});
