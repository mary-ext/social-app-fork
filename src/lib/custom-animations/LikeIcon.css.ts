import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

/** Diameter of the heart and the burst circles, set per render from the icon `size`. */
export const sizeVar = createVar();

export const root = style({
	display: 'flex',
	// an own stacking context keeps the `zIndex: -1` burst circles behind the heart yet in front of the
	// post, instead of escaping to paint behind it
	isolation: 'isolate',
	pointerEvents: 'none',
	position: 'relative',
});

const circle = style({
	borderRadius: '50%',
	height: sizeVar,
	left: 0,
	opacity: 0,
	position: 'absolute',
	top: 0,
	width: sizeVar,
	zIndex: -1,
});
export const circle1 = style([circle, { backgroundColor: vars.palette.pink }]);
export const circle2 = style([circle, { backgroundColor: vars.palette.contrast_0 }]);
