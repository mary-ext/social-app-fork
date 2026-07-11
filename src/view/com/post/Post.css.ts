import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

export const outer = style({
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	paddingLeft: 16,
	paddingRight: 16,
	paddingTop: 12,
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

export const outerBorder = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
});

export const metaSpacing = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: 4,
});

export const repliedTo = style({
	paddingBottom: 4,
});
