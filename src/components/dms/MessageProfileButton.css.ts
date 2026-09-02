import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const skeleton = style({
	opacity: 0.3,
	backgroundColor: colors.contrast_25,
	color: colors.text,
});
