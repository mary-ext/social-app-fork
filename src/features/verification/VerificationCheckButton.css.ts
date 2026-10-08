import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';

export const button = style({
	display: 'inline-flex',
	transition: 'transform 0.1s',
	border: 0,
	background: 'none',
	padding: 0,
	cursor: 'pointer',
	selectors: {
		[hover()]: { transform: 'scale(1.1)' },
	},
});

export const check = style({ color: colors.primary_500 });

export const checkMuted = style({ color: colors.contrast_100 });
