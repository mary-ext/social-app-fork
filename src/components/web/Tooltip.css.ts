import { style } from '@vanilla-extract/css';

import { fontSizeVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';

export const positioner = style({
	// sit above dialogs (zIndex 10) and menus (zIndex 11) so a tooltip on a trigger inside either still shows
	zIndex: 12,
});

export const popup = style({
	backgroundColor: vars.palette.contrast_100,
	borderRadius: 6,
	display: 'flex',
	boxSizing: 'border-box',
	paddingBlock: 6,
	paddingInline: 10,
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	whiteSpace: 'nowrap',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			opacity: 0,
			transform: 'scale(0.95)',
		},
	},
});

export const text = style({
	vars: {
		[fontSizeVar]: '12px',
	},
});
