import { style } from '@vanilla-extract/css';

import { MOUSE } from '#/styles/interaction';
import { borderRadius, iconSize } from '#/styles/tokens.css';

export const navHost = style({ position: 'relative' });

export const navButton = style({
	display: 'flex',
	position: 'absolute',
	top: '50%',
	alignItems: 'center',
	justifyContent: 'center',
	transform: 'translateY(-50%)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity',
	zIndex: 1,
	border: 'none',
	borderRadius: borderRadius.full,
	WebkitBackdropFilter: 'blur(10px)',
	backdropFilter: 'blur(10px)',
	background: 'rgba(0, 0, 0, 0.55)',
	padding: 0,
	width: 32,
	height: 32,
	color: '#fff',
	opacity: 0,
	cursor: 'pointer',
	selectors: {
		[`${MOUSE} ${navHost}:hover &:enabled`]: { opacity: 1 },
		'&:focus-visible': { opacity: 1 },
		[`${MOUSE} &:hover`]: { background: 'rgba(0, 0, 0, 0.7)' },
		'&:disabled': { pointerEvents: 'none' },
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': { transition: 'none' },
	},
});

export const navLeft = style({ left: 4 });
export const navRight = style({ right: 4 });

export const navIcon = style({
	width: iconSize.md,
	height: iconSize.md,
});
