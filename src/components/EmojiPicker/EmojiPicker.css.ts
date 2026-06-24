import { style } from '@vanilla-extract/css';

import { zIndex } from '#/styles/tokens.css';

export const positioner = style({
	zIndex: zIndex.menu,
});

// the Base UI popup is just a positioning shell; the panel below brings its own surface chrome. scale+fade on
// open/close, keyed off Base UI's starting/ending-style attributes + `--transform-origin`.
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
