import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

export const link = style({
	alignItems: 'center',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	paddingLeft: 16,
	textDecoration: 'none',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

export const spine = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: 4,
	width: 36,
});

export const segment = style({
	backgroundColor: vars.palette.contrast_100,
	height: 9,
	width: 2,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: vars.palette.contrast_200,
		},
	},
});

export const dash = style({
	backgroundColor: vars.palette.contrast_200,
	height: 2,
	width: 2,
});
