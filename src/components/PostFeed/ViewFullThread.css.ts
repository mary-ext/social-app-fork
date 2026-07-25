import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

export const link = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	alignItems: 'center',
	paddingLeft: 16,
	textDecoration: 'none',
	cursor: 'pointer',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

export const spine = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: 4,
	alignItems: 'center',
	width: 36,
});

export const segment = style({
	backgroundColor: vars.palette.contrast_100,
	width: 2,
	height: 9,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: vars.palette.contrast_200,
		},
	},
});

export const dash = style({
	backgroundColor: vars.palette.contrast_200,
	width: 2,
	height: 2,
});
