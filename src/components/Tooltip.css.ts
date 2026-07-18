import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

export const positioner = style({
	zIndex: zIndex.tooltip,
});

export const popup = style({
	boxSizing: 'border-box',
	display: 'flex',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	borderRadius: 6,
	backgroundColor: vars.palette.contrast_100,
	paddingBlock: 6,
	paddingInline: 10,
	whiteSpace: 'nowrap',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			transform: 'scale(0.95)',
			opacity: 0,
		},
	},
});
