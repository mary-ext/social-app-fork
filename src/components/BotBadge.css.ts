import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const icon = style({
	display: 'inline-block',
});

export const button = style({
	':hover': { transform: 'scale(1.1)' },
	alignItems: 'center',
	background: 'none',
	border: 0,
	color: colors.textContrastMedium,
	cursor: 'pointer',
	display: 'inline-flex',
	justifyContent: 'center',
	padding: 0,
	transition: 'transform 0.1s',
});
