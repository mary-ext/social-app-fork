import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._4xl,
	alignItems: 'center',
	paddingBlock: 150,
	paddingInline: space.xl,
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	alignItems: 'center',
	maxWidth: 294,
	'@media': {
		'(width >= 800px)': {
			gap: space.md,
			maxWidth: 394,
		},
	},
});

export const xIcon = style({
	width: iconSize._3xl,
	height: iconSize._3xl,
	color: colors.textContrastLow,
});
