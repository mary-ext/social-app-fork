import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const srOnly = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clip: 'rect(0, 0, 0, 0)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});

export const inactiveSave = style({
	color: vars.palette.contrast_400,
});
