import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// the composer toolbar's icon buttons: a 40×40 ghost circle with a primary_500 icon. unlayered, so it wins
// over the web Button recipe's `components` layer — the Button still supplies the reset, focus ring, disabled
// opacity, full border radius, and ref forwarding; this only sets the toolbar-specific size + color.
export const button = style({
	color: vars.palette.primary_500,
	height: 40,
	padding: 0,
	width: 40,
	selectors: {
		'&:hover:not(:disabled)': { backgroundColor: vars.palette.primary_100 },
	},
});
