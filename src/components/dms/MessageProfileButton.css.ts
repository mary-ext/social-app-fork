import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius } from '#/styles/tokens.css';

export const loading = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.full,
	color: colors.text,
	display: 'flex',
	height: 33,
	justifyContent: 'center',
	opacity: 0.3,
	width: 33,
});
