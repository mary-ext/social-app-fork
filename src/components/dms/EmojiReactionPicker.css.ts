import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// the message-hover trigger button (rendered by ActionsWrapper). opacity is driven inline (message hover /
// picker open); this supplies the resting chrome + hover fill.
export const trigger = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: 999,
	cursor: 'pointer',
	display: 'inline-flex',
	justifyContent: 'center',
	padding: 4,
	transitionDuration: '100ms',
	transitionProperty: 'opacity',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_25 },
	},
});

// the Base UI popup is just a positioning shell — the quick-reaction pill and the emoji-mart panel each bring
// their own surface chrome (so the expanded picker isn't trapped in a pill). scale+fade on open/close, keyed
// off Base UI's starting/ending-style attributes + `--transform-origin`.
export const popup = style({
	outline: 0,
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

export const quickRow = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 999,
	boxShadow: vars.shadow.lg,
	display: 'flex',
	gap: 4,
	padding: 6,
});

export const reaction = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: '1px solid transparent',
	borderRadius: 999,
	cursor: 'pointer',
	display: 'flex',
	height: 34,
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	width: 34,
	selectors: {
		'&:hover': { transform: 'scale(1.1)' },
		'&:focus-visible': { borderColor: vars.palette.contrast_1000, outline: 'none' },
	},
});

export const reactionSelected = style({
	backgroundColor: vars.palette.contrast_100,
});

// limit reached and not yet a reaction of ours: dimmed and inert-looking (the tap is still a no-op).
export const reactionDisabled = style({
	opacity: 0.7,
	selectors: {
		'&:hover': { transform: 'none' },
	},
});

export const reactionGlyph = style({
	fontSize: 28,
	lineHeight: 1,
});

export const expandButton = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: '1px solid transparent',
	borderRadius: 999,
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	display: 'flex',
	height: 34,
	justifyContent: 'center',
	width: 34,
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_100 },
		'&:focus-visible': { borderColor: vars.palette.contrast_1000, outline: 'none' },
	},
});
