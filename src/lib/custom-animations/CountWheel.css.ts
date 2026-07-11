import { keyframes, style } from '@vanilla-extract/css';

const DISTANCE = '18px';
const TIMING = '400ms cubic-bezier(0.4, 0, 0.2, 1) forwards';

export const root = style({
	display: 'inline-flex',
	position: 'relative',
});

const cell = style({ alignItems: 'center', display: 'flex' });
export const current = cell;

const enterUpFrames = keyframes({
	from: { opacity: 0, transform: `translateY(${DISTANCE})` },
	to: { opacity: 1, transform: 'translateY(0)' },
});
const enterDownFrames = keyframes({
	from: { opacity: 0, transform: `translateY(-${DISTANCE})` },
	to: { opacity: 1, transform: 'translateY(0)' },
});
const exitUpFrames = keyframes({
	from: { opacity: 1, transform: 'translateY(0)' },
	to: { opacity: 0, transform: `translateY(-${DISTANCE})` },
});
const exitDownFrames = keyframes({
	from: { opacity: 1, transform: 'translateY(0)' },
	to: { opacity: 0, transform: `translateY(${DISTANCE})` },
});

export const enterUp = style({ animation: `${enterUpFrames} ${TIMING}` });
export const enterDown = style({ animation: `${enterDownFrames} ${TIMING}` });

const exiting = style([cell, { left: 0, position: 'absolute', top: 0 }]);
export const exitUp = style([exiting, { animation: `${exitUpFrames} ${TIMING}` }]);
export const exitDown = style([exiting, { animation: `${exitDownFrames} ${TIMING}` }]);
