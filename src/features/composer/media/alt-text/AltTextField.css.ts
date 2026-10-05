import { style } from '@vanilla-extract/css';

export const counter = style({
	flexShrink: 0,
	fontVariantNumeric: 'tabular-nums',
});

export const srOnly = style({
	position: 'absolute',
	transform: 'scale(0)',
});
