import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, monoFontFamily, space } from '#/styles/tokens.css';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	padding: space._2xl,
	textAlign: 'center',
});

export const details = style({
	boxSizing: 'border-box',
	borderRadius: borderRadius.sm,
	backgroundColor: vars.palette.contrast_25,
	padding: space.md,
	width: '100%',
	maxHeight: 160,
	overflow: 'auto',
	textAlign: 'left',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	color: colors.textContrastHigh,
	fontFamily: monoFontFamily,
	fontSize: 13,
});
