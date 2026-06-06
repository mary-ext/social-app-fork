import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

/** Play-icon edge length in px; the circle behind it is sized at 1.6667× this. */
export const sizeVar = createVar();
const size = fallbackVar(sizeVar, '32px');

// the circle + icon stack in a single grid cell so the icon centres without absolute positioning.
export const wrap = style({
	display: 'inline-grid',
	placeItems: 'center',
});

// RNW flips bg/fg by theme name; the palette also inverts, so the net result is a light circle with a dark
// glyph in every theme. reproduced here with the theme selectors rather than a runtime `t.name` check.
export const circle = style({
	borderRadius: '9999px',
	boxShadow: '0 0 32px rgba(0, 0, 0, 0.5)',
	gridArea: '1 / 1',
	height: `calc(${size} * 1.6667)`,
	opacity: 0.7,
	width: `calc(${size} * 1.6667)`,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_25 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_975 },
	},
});

export const icon = style({
	display: 'inline-flex',
	gridArea: '1 / 1',
	selectors: {
		'.theme--light &': { color: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { color: vars.palette.contrast_25 },
	},
});
