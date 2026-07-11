import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.sm,
	borderStyle: 'solid',
	borderWidth: 1,
	padding: space.md,
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
	},
});

export const revealedPad = style({
	paddingTop: 4,
});
