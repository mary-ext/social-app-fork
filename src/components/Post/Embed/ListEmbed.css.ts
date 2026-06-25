import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

// hairline-bordered, padded, rounded container around the embedded list info.
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

// ModeratedListEmbed: lift the revealed card off the blur toggle.
export const revealedPad = style({
	paddingTop: 4,
});
