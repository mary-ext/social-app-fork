import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { iconSize, space } from '#/styles/tokens.css';

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
});

export const icon = style({
	width: iconSize.xs,
	height: iconSize.xs,
	color: colors.textContrastMedium,
	position: 'relative',
	top: -1,
	flexShrink: 0,
});

export const label = style({
	flex: 1,
	minWidth: 0,
});

export const loadingName = style({
	display: 'inline-block',
	position: 'relative',
	top: 1,
	left: 2,
	borderRadius: 6,
	backgroundColor: vars.palette.contrast_50,
	width: 80,
	height: 8,
});
