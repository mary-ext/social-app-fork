import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const gifBox = style({
	padding: 16,
});

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	paddingBlockEnd: 16,
	paddingInline: 16,
});

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
