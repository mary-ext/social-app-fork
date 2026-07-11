import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const sizeVar = createVar();

export const root = style({
	display: 'flex',
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
