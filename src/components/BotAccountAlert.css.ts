import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
});

export const icon = style({
	width: iconSize._4xl,
	height: iconSize._4xl,
	color: colors.textContrastMedium,
	alignSelf: 'center',
	paddingBottom: space.md,
});

export const text = style({
	alignSelf: 'center',
	paddingBottom: space.xl,
	maxWidth: 300,
});
