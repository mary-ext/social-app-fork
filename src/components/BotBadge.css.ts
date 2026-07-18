import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const icon = style({
	display: 'inline-block',
});

export const button = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'transform 0.1s',
	border: 0,
	background: 'none',
	padding: 0,
	color: colors.textContrastMedium,
	cursor: 'pointer',
	':hover': { transform: 'scale(1.1)' },
});
