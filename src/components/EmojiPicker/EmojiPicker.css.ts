import { style } from '@vanilla-extract/css';

import { zIndex } from '#/styles/tokens.css';

export const positioner = style({
	zIndex: zIndex.popover,
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
