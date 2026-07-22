import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, fontWeight } from '#/styles/tokens.css';

export const icon = style({
	height: 20,
	color: vars.palette.contrast_700,
});

export const trigger = style({
	alignSelf: 'flex-start',
	gap: 8,
	paddingLeft: 8,
	paddingRight: 4,
	color: vars.palette.contrast_700,
	textAlign: 'start',
});

export const value = style({
	color: vars.palette.contrast_1000,
	fontSize: fontSize.md_sub,
	fontWeight: fontWeight.normal,
	lineHeight: roundToPx(`calc(${fontSize.md_sub} * ${fontLeading.md_sub})`),
});
