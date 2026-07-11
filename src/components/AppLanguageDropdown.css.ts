import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, fontWeight } from '#/styles/tokens.css';

export const trigger = style({
	alignSelf: 'flex-start',
	color: vars.palette.contrast_700,
	gap: 8,
	paddingLeft: 8,
	paddingRight: 4,
	textAlign: 'start',
});

export const value = style({
	color: vars.palette.contrast_1000,
	fontSize: fontSize.sm,
	fontWeight: fontWeight.normal,
	lineHeight: roundToPx(`calc(${fontSize.sm} * ${fontLeading.sm})`),
});

export const icon = style({
	color: vars.palette.contrast_700,
	height: 20,
});
