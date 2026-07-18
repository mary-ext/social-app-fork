import { keyframes, style } from '@vanilla-extract/css';

import { zIndex } from '#/styles/tokens.css';

const fadeIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
});

export const portal = style({
	zIndex: zIndex.modal,
});

export const backdrop = style({
	position: 'fixed',
	inset: 0,
	background: 'rgba(0, 0, 0, 0.92)',
	opacity: 1,
	transition: 'opacity 200ms ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

export const popup = style({
	position: 'fixed',
	inset: 0,
	outline: 'none',
	transition: 'opacity 200ms ease, transform 200ms ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.96)' },
	},
});

export const viewport = style({
	position: 'relative',
	cursor: 'default',
});

export const chrome = style({
	position: 'absolute',
	inset: 0,
	zIndex: 1,
	pointerEvents: 'none',
	transition: 'opacity 200ms ease, visibility 200ms ease',
});

export const chromeHidden = style({
	opacity: 0,
	visibility: 'hidden',
});

const blurred = {
	backdropFilter: 'blur(8px)',
	WebkitBackdropFilter: 'blur(8px)',
} as const;

export const circle = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 32,
	height: 32,
	padding: 0,
	border: 'none',
	borderRadius: 16,
	color: '#fff',
	background: 'rgba(0, 0, 0, 0.75)',
	cursor: 'pointer',
	pointerEvents: 'auto',
	animation: `${fadeIn} 200ms ease 200ms both`,
	...blurred,
	selectors: {
		'&:hover': { background: 'rgba(0, 0, 0, 0.85)' },
	},
});

export const topLeft = style({ position: 'absolute', top: 20, left: 20, zIndex: 1 });
export const topRight = style({ position: 'absolute', top: 20, right: 20, zIndex: 1 });

export const rotated = style({ transform: 'rotate(90deg)' });

export const navButton = style({
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 42,
	height: 42,
	padding: 0,
	border: 'none',
	borderRadius: 21,
	color: '#fff',
	background: 'rgba(0, 0, 0, 0.47)',
	cursor: 'pointer',
	pointerEvents: 'auto',
	zIndex: 1,
	animation: `${fadeIn} 200ms ease 200ms both`,
	backdropFilter: 'blur(10px)',
	WebkitBackdropFilter: 'blur(10px)',
	selectors: {
		'&:hover': { background: 'rgba(0, 0, 0, 0.53)' },
	},
	'@media': {
		'screen and (max-width: 800px)': { width: 34, height: 34 },
	},
});
export const navLeft = style({ left: 20 });
export const navRight = style({ right: 20 });

export const altPanel = style({
	position: 'absolute',
	left: 0,
	right: 0,
	bottom: 0,
	zIndex: 1,
	background: 'rgba(0, 0, 0, 0.45)',
	animation: `${fadeIn} 200ms ease 200ms both`,
});

export const altButton = style({
	display: 'block',
	width: '100%',
	margin: 0,
	padding: '16px 32px',
	border: 'none',
	background: 'transparent',
	textAlign: 'left',
	cursor: 'pointer',
	pointerEvents: 'auto',
});

export const altText = style({
	color: '#fff',
	lineHeight: 1.4,
});

export const pagerDots = style({
	position: 'absolute',
	top: 20,
	left: 0,
	right: 0,
	zIndex: 1,
	display: 'flex',
	gap: 5,
	alignItems: 'center',
	justifyContent: 'center',
	pointerEvents: 'none',
	animation: `${fadeIn} 200ms ease 200ms both`,
});

const dotBase = {
	borderRadius: 999,
} as const;
export const dotPill = style({
	display: 'flex',
	gap: 5,
	alignItems: 'center',
	padding: '6px 10px',
	borderRadius: 999,
	background: 'rgba(0, 0, 0, 0.75)',
	...blurred,
});
export const dotActive = style({ ...dotBase, width: 6, height: 6, background: '#fff' });
export const dotInactive = style({ ...dotBase, width: 4, height: 4, background: 'rgba(255, 255, 255, 0.4)' });

export const slideSpinner = style({
	position: 'absolute',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	pointerEvents: 'none',
});

export const srOnly = style({
	position: 'absolute',
	width: 1,
	height: 1,
	margin: -1,
	padding: 0,
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	whiteSpace: 'nowrap',
	border: 0,
});
