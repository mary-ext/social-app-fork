import { keyframes, style } from '@vanilla-extract/css';

import { borderRadius, iconSize, space, zIndex } from '#/styles/tokens.css';

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

const blurred = style({
	WebkitBackdropFilter: 'blur(8px)',
	backdropFilter: 'blur(8px)',
});

const scrim = 'rgba(0, 0, 0, 0.75)';

export const circle = style([
	blurred,
	{
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		animation: `${fadeIn} 200ms ease 200ms both`,
		border: 'none',
		borderRadius: borderRadius.lg,
		background: scrim,
		padding: 0,
		width: 32,
		height: 32,
		color: '#fff',
		cursor: 'pointer',
		pointerEvents: 'auto',
		selectors: {
			'&:hover': { background: 'rgba(0, 0, 0, 0.85)' },
		},
	},
]);

export const topLeft = style({ position: 'absolute', top: 20, left: 20, zIndex: 1 });
export const topRight = style({ position: 'absolute', top: 20, right: 20, zIndex: 1 });

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
		'&:disabled': { animation: 'none', opacity: 0, pointerEvents: 'none' },
	},
	'@media': {
		'screen and (max-width: 800px)': { width: 34, height: 34 },
	},
});
export const navLeft = style({ left: 20 });
export const navRight = style({ right: 20 });

export const altPanel = style([
	blurred,
	{
		position: 'absolute',
		right: 20,
		bottom: 20,
		left: 20,
		animation: `${fadeIn} 200ms ease 200ms both`,
		zIndex: 1,
		margin: '0 auto',
		borderRadius: borderRadius.sm,
		background: scrim,
		boxSizing: 'border-box',
		paddingBlock: space.lg,
		paddingInline: space.xl,
		maxWidth: '72ch',
		maxHeight: '40svh',
		overflowY: 'auto',
		overscrollBehavior: 'contain',
		pointerEvents: 'auto',
	},
]);

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

const dotBase = style({
	borderRadius: borderRadius.full,
});

export const dotPill = style([
	blurred,
	{
		display: 'flex',
		gap: 5,
		alignItems: 'center',
		borderRadius: borderRadius.full,
		background: scrim,
		padding: '6px 10px',
	},
]);
export const dotActive = style([
	dotBase,
	{
		background: '#fff',
		width: 6,
		height: 6,
	},
]);
export const dotInactive = style([
	dotBase,
	{
		background: 'rgba(255, 255, 255, 0.4)',
		width: 4,
		height: 4,
	},
]);

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
	transform: 'scale(0)',
});

export const controlIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
});

export const controlIconRotated = style([controlIcon, { transform: 'rotate(90deg)' }]);
