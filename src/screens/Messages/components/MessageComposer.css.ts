import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// the emoji-picker trigger overlaid on the message input's top-right corner (the input reserves right padding
// for it). resting at text-contrast-high; turns primary when hovered, focused, or while the picker is open.
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

// nudges the send-button icon (paper plane / spinner) up to sit optically centered.
export const sendIcon = style({
	marginBottom: 2,
});
