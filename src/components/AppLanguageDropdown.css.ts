import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, fontWeight } from '#/styles/tokens.css';

export const trigger = style({
	gap: 8,
	alignSelf: 'flex-start',
	paddingRight: 4,
	paddingLeft: 8,
	textAlign: 'start',
	color: vars.palette.contrast_700,
});

export const value = style({
	lineHeight: roundToPx(`calc(${fontSize.sm} * ${fontLeading.sm})`),
	color: vars.palette.contrast_1000,
	fontSize: fontSize.sm,
	fontWeight: fontWeight.normal,
});

export const icon = style({
	height: 20,
	color: vars.palette.contrast_700,
});
