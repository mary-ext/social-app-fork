import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.md,
	borderColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	padding: space.md,
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
	},
});

export const revealedPad = style({
	paddingTop: 4,
});
