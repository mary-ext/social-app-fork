import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const body = style({
	backgroundColor: colors.contrast_25,
	overscrollBehaviorX: 'contain',
});

export const link = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
});

export const linkIcon = style({
	width: iconSize.xs,
	height: iconSize.xs,
	color: colors.textLink,
});
