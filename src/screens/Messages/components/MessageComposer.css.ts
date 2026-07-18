import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const emojiButton = style({
	appearance: 'none',
	display: 'inline-flex',
	position: 'absolute',
	top: 10,
	right: 10,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 30,
	border: 'none',
	borderRadius: 999,
	background: 'transparent',
	padding: 0,
	width: 20,
	height: 20,
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	selectors: {
		'&:hover': { color: vars.palette.primary_500 },
		'&:focus-visible': { color: vars.palette.primary_500 },
		'&[data-popup-open]': { color: vars.palette.primary_500 },
	},
});

export const editor = style({
	flex: 1,
});

export const sendIcon = style({
	marginBottom: 2,
});
