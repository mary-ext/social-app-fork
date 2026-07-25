import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const button = style({
	position: 'relative',
	isolation: 'isolate',
	paddingInline: 8,
	minWidth: 36,
	overflow: 'hidden',
});

export const text = style({
	textTransform: 'uppercase',
});

const pulse = keyframes({
	'0%': { opacity: 0 },
	'18.75%': { opacity: 1 },
	'50%': { opacity: 0 },
	'68.75%': { opacity: 1 },
	'100%': { opacity: 0 },
});

export const pulseOverlay = style({
	position: 'absolute',
	inset: 0,
	animationName: pulse,
	animationDuration: '1600ms',
	animationTimingFunction: 'ease-in-out',
	opacity: 0,
	zIndex: -1,
	backgroundColor: vars.palette.contrast_50,
	pointerEvents: 'none',
});
