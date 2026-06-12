import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const rotate = keyframes({
	from: { transform: 'rotate(0deg)' },
	to: { transform: 'rotate(360deg)' },
});

// spins the icon in place (sized by the icon itself), unlike the global `.rotate-500ms` helper which is
// `position:absolute; inset:0` and would stretch across the whole placeholder.
export const spinner = style({
	animation: `${rotate} 500ms linear infinite`,
	display: 'inline-flex',
});

// sit above the Base UI Sheet (backdrop/viewport are zIndex 10), like the web Menu popup.
export const positioner = style({
	zIndex: 11,
});

// the emoji-mart picker brings its own surface chrome; the popup only adds the open/close transition.
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

// stand-in shown while the lazily-loaded picker chunk downloads (sized to the emoji-mart panel).
export const placeholder = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxSizing: 'border-box',
	color: vars.palette.contrast_900,
	display: 'flex',
	height: 435,
	justifyContent: 'center',
	width: 338,
});
