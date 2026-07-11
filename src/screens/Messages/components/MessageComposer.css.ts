import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const emojiButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: 999,
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	display: 'inline-flex',
	height: 20,
	justifyContent: 'center',
	padding: 0,
	position: 'absolute',
	right: 10,
	top: 10,
	width: 20,
	zIndex: 30,
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
