import { keyframes, style } from '@vanilla-extract/css';

const DISTANCE = '18px';
const TIMING = '400ms cubic-bezier(0.4, 0, 0.2, 1) forwards';

export const root = style({
	display: 'inline-flex',
	position: 'relative',
});

const cell = style({ display: 'flex', alignItems: 'center' });
export const current = cell;

const enterUpFrames = keyframes({
	from: { transform: `translateY(${DISTANCE})`, opacity: 0 },
	to: { transform: 'translateY(0)', opacity: 1 },
});
const enterDownFrames = keyframes({
	from: { transform: `translateY(-${DISTANCE})`, opacity: 0 },
	to: { transform: 'translateY(0)', opacity: 1 },
});
const exitUpFrames = keyframes({
	from: { transform: 'translateY(0)', opacity: 1 },
	to: { transform: `translateY(-${DISTANCE})`, opacity: 0 },
});
const exitDownFrames = keyframes({
	from: { transform: 'translateY(0)', opacity: 1 },
	to: { transform: `translateY(${DISTANCE})`, opacity: 0 },
});

export const enterUp = style({ animation: `${enterUpFrames} ${TIMING}` });
export const enterDown = style({ animation: `${enterDownFrames} ${TIMING}` });

const exiting = style([cell, { position: 'absolute', top: 0, left: 0 }]);
export const exitUp = style([exiting, { animation: `${exitUpFrames} ${TIMING}` }]);
export const exitDown = style([exiting, { animation: `${exitDownFrames} ${TIMING}` }]);
