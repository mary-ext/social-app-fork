import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const trigger = style({
	appearance: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'opacity',
	border: 'none',
	borderRadius: 999,
	background: 'transparent',
	padding: 4,
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const popup = style({
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	outline: 0,
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
	},
});

export const quickRow = style({
	display: 'flex',
	gap: 4,
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 999,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	padding: 6,
});

export const reaction = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	border: '1px solid transparent',
	borderRadius: 999,
	background: 'transparent',
	width: 34,
	height: 34,
	cursor: 'pointer',
	selectors: {
		'&:hover': { transform: 'scale(1.1)' },
		'&:focus-visible': { outline: 'none', borderColor: vars.palette.contrast_1000 },
	},
});

export const reactionSelected = style({
	backgroundColor: vars.palette.contrast_100,
});

export const reactionDisabled = style({
	opacity: 0.7,
	selectors: {
		'&:hover': { transform: 'none' },
	},
});

export const reactionGlyph = style({
	lineHeight: 1,
	fontSize: 28,
});

export const expandButton = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	border: '1px solid transparent',
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_50,
	width: 34,
	height: 34,
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_100 },
		'&:focus-visible': { outline: 'none', borderColor: vars.palette.contrast_1000 },
	},
});
