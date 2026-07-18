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
	transition: 'opacity 200ms ease',
	opacity: 1,
	background: 'rgba(0, 0, 0, 0.92)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

export const popup = style({
	position: 'fixed',
	inset: 0,
	transition: 'opacity 200ms ease, transform 200ms ease',
	outline: 'none',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.96)', opacity: 0 },
	},
});

export const viewport = style({
	position: 'relative',
	cursor: 'default',
});

export const chrome = style({
	position: 'absolute',
	inset: 0,
	transition: 'opacity 200ms ease, visibility 200ms ease',
	zIndex: 1,
	pointerEvents: 'none',
});

export const chromeHidden = style({
	visibility: 'hidden',
	opacity: 0,
});

const blurred = {
	WebkitBackdropFilter: 'blur(8px)',
	backdropFilter: 'blur(8px)',
} as const;

export const circle = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	animation: `${fadeIn} 200ms ease 200ms both`,
	border: 'none',
	borderRadius: 16,
	background: 'rgba(0, 0, 0, 0.75)',
	padding: 0,
	width: 32,
	height: 32,
	color: '#fff',
	cursor: 'pointer',
	pointerEvents: 'auto',
	...blurred,
	selectors: {
		'&:hover': { background: 'rgba(0, 0, 0, 0.85)' },
	},
});

export const topLeft = style({ position: 'absolute', top: 20, left: 20, zIndex: 1 });
export const topRight = style({ position: 'absolute', top: 20, right: 20, zIndex: 1 });

export const rotated = style({ transform: 'rotate(90deg)' });

export const navButton = style({
	display: 'flex',
	position: 'absolute',
	top: '50%',
	alignItems: 'center',
	justifyContent: 'center',
	transform: 'translateY(-50%)',
	animation: `${fadeIn} 200ms ease 200ms both`,
	zIndex: 1,
	border: 'none',
	borderRadius: 21,
	WebkitBackdropFilter: 'blur(10px)',
	backdropFilter: 'blur(10px)',
	background: 'rgba(0, 0, 0, 0.47)',
	padding: 0,
	width: 42,
	height: 42,
	color: '#fff',
	cursor: 'pointer',
	pointerEvents: 'auto',
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
	right: 0,
	bottom: 0,
	left: 0,
	animation: `${fadeIn} 200ms ease 200ms both`,
	zIndex: 1,
	background: 'rgba(0, 0, 0, 0.45)',
});

export const altButton = style({
	display: 'block',
	margin: 0,
	border: 'none',
	background: 'transparent',
	padding: '16px 32px',
	width: '100%',
	textAlign: 'left',
	cursor: 'pointer',
	pointerEvents: 'auto',
});

export const altText = style({
	lineHeight: 1.4,
	color: '#fff',
});

export const pagerDots = style({
	display: 'flex',
	position: 'absolute',
	top: 20,
	right: 0,
	left: 0,
	gap: 5,
	alignItems: 'center',
	justifyContent: 'center',
	animation: `${fadeIn} 200ms ease 200ms both`,
	zIndex: 1,
	pointerEvents: 'none',
});

const dotBase = {
	borderRadius: 999,
} as const;
export const dotPill = style({
	display: 'flex',
	gap: 5,
	alignItems: 'center',
	borderRadius: 999,
	background: 'rgba(0, 0, 0, 0.75)',
	padding: '6px 10px',
	...blurred,
});
export const dotActive = style({ ...dotBase, background: '#fff', width: 6, height: 6 });
export const dotInactive = style({ ...dotBase, background: 'rgba(255, 255, 255, 0.4)', width: 4, height: 4 });

export const slideSpinner = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	pointerEvents: 'none',
});

export const srOnly = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clip: 'rect(0, 0, 0, 0)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});
