import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

const ICON_SIZE = 32;

export const description = style({
	display: 'block',
	paddingBottom: space.sm,
	paddingInline: space.lg,
});

export const row = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	border: 'none',
	backgroundColor: 'transparent',
	paddingBlock: space.md,
	paddingInline: space.lg,
	width: '100%',
	textAlign: 'start',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: colors.contrast_25 },
	},
});

export const rowText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const iconSlot = style({
	display: 'grid',
	flexShrink: 0,
	placeContent: 'center',
	width: ICON_SIZE,
	height: ICON_SIZE,
});

export const supportIcon = style([
	iconSlot,
	{
		border: `1px solid ${colors.positive_100}`,
		borderRadius: borderRadius.full,
		backgroundColor: colors.positive_25,
		color: colors.positive_700,
	},
]);

export const supportLogo = style({
	width: iconSize.md,
	height: iconSize.md,
});

export const globe = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.textContrastMedium,
});

export const chevron = style({
	flexShrink: 0,
	width: iconSize.md,
	height: iconSize.md,
	color: colors.textContrastLow,
});
