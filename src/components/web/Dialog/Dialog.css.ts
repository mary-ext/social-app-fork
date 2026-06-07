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
	border: `1px solid ${vars.palette.contrast_200}`,
	borderRadius: 12,
	boxShadow: vars.shadow.dialog,
	boxSizing: 'border-box',
	padding: 24,
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
	default: { maxWidth: 600 },
	narrow: { maxWidth: 400 },
});

export const closeBtn = style({
	alignItems: 'center',
	appearance: 'none',
	// solid surface bg (matches the RNW ghost-secondary close): blends into a card, but reads as a circle
	// over a backdrop (e.g. the GIF picker's outer close).
	backgroundColor: vars.palette.contrast_0,
	border: 'none',
	borderRadius: 999,
	color: vars.palette.contrast_600,
	cursor: 'pointer',
	display: 'inline-flex',
	height: 33,
	justifyContent: 'center',
	position: 'absolute',
	right: 12,
	top: 12,
	width: 33,
	zIndex: 10,
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

// declared after `closeBtn` so it wins by source order: pins the button to the screen corner (outside the
// popup card) — for full-height dialogs whose close floats over the backdrop, like the GIF picker.
export const closeBtnOuter = style({
	position: 'fixed',
	zIndex: 11,
});
