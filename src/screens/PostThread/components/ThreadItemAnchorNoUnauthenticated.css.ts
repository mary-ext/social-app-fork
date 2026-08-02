import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const container = style({
	padding: space.lg,
});

export const text = style({
	fontStyle: 'italic',
});

export const lockIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.textContrastMedium,
});
