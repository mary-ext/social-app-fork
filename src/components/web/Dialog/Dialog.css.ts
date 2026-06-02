import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const backdrop = style({
	backgroundColor: 'rgba(0, 0, 0, 0.8)',
	inset: 0,
	position: 'fixed',
	transitionDuration: '150ms',
	transitionProperty: 'opacity',
	zIndex: 10,
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

export const viewport = style({
	alignItems: 'flex-start',
	bottom: 0,
	boxSizing: 'border-box',
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	overflowY: 'auto',
	padding: '10vh 16px',
	position: 'fixed',
	right: 0,
	top: 0,
	zIndex: 10,
});

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	borderRadius: '12px',
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	padding: '20px',
	position: 'relative',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	width: '100%',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

export const popupSize = styleVariants({
	default: { maxWidth: '600px' },
	narrow: { maxWidth: '400px' },
});

export const closeBtn = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: '999px',
	color: vars.palette.contrast_600,
	cursor: 'pointer',
	display: 'inline-flex',
	height: '34px',
	justifyContent: 'center',
	position: 'absolute',
	right: '8px',
	top: '8px',
	width: '34px',
	zIndex: 10,
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '2px' },
	},
});
