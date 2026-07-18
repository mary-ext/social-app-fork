import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingTop: 12,
	paddingRight: 16,
	paddingLeft: 16,
	cursor: 'pointer',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

export const outerBorder = style({
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
});

export const metaSpacing = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	paddingBottom: 4,
});

export const repliedTo = style({
	paddingBottom: 4,
});
