import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

const hidden = {
	transform: 'scale(0.95)',
	opacity: 0,
};

export const positioner = style({
	width: 'anchor-size(width)',
	minWidth: 300,
});

export const popup = style({
	boxSizing: 'border-box',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	width: '100%',
	maxHeight: '70vh',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	selectors: {
		'&[data-closed]': hidden,
	},
	'@starting-style': hidden,
});
