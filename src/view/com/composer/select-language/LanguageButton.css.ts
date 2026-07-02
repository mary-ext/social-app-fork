import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const button = style({
	isolation: 'isolate',
	overflow: 'hidden',
	position: 'relative',
});

const pulse = keyframes({
	'0%': { opacity: 0 },
	'18.75%': { opacity: 1 },
	'50%': { opacity: 0 },
	'68.75%': { opacity: 1 },
	'100%': { opacity: 0 },
});

export const pulseOverlay = style({
	animationDuration: '1600ms',
	animationName: pulse,
	animationTimingFunction: 'ease-in-out',
	backgroundColor: vars.palette.contrast_50,
	inset: 0,
	opacity: 0,
	pointerEvents: 'none',
	position: 'absolute',
	zIndex: -1,
});
