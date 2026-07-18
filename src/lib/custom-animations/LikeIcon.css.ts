import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const sizeVar = createVar();

export const root = style({
	display: 'flex',
	position: 'relative',
	isolation: 'isolate',
	pointerEvents: 'none',
});

const circle = style({
	position: 'absolute',
	top: 0,
	left: 0,
	opacity: 0,
	zIndex: -1,
	borderRadius: '50%',
	width: sizeVar,
	height: sizeVar,
});
export const circle1 = style([circle, { backgroundColor: vars.palette.pink }]);
export const circle2 = style([circle, { backgroundColor: vars.palette.contrast_0 }]);
