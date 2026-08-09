import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const srOnly = style({
	position: 'absolute',
	transform: 'scale(0)',
});

export const inactiveSave = style({
	color: vars.palette.contrast_400,
});
