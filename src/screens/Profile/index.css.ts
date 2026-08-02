import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	overflowAnchor: 'none',
});

export const editBigIcon = style({
	width: iconSize.xl,
	height: iconSize.xl,
	color: colors.white,
});
