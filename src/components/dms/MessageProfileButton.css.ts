import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius } from '#/styles/tokens.css';

export const loading = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	opacity: 0.3,
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	width: 33,
	height: 33,
	color: colors.text,
});
