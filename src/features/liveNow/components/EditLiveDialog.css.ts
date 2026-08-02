import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize } from '#/styles/tokens.css';

export const expiryRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	alignItems: 'center',
});

export const clockIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.textContrastHigh,
});
