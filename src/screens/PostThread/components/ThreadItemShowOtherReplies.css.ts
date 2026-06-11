import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
	paddingBottom: space.lg,
	paddingLeft: space.xl,
	paddingRight: space.xl,
	paddingTop: space.lg,
});

export const rowIdle = style({
	backgroundColor: colors.bg,
});

export const rowActive = style({
	backgroundColor: colors.contrast_25,
});

export const iconCircle = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: 13,
	// the icon inherits this via `fill="currentColor"`
	color: colors.textContrastMedium,
	display: 'flex',
	height: 26,
	justifyContent: 'center',
	marginRight: 4,
	width: 26,
});

export const label = style({
	flex: 1,
});
