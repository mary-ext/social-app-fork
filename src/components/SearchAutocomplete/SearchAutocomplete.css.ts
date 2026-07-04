import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space, zIndex } from '#/styles/tokens.css';

export const positioner = style({
	// don't shrink below a comfortable calendar width on a narrow rail; cap at the viewport when wider.
	maxWidth: 'var(--available-width)',
	minWidth: 300,
	width: 'var(--anchor-width)',
	zIndex: zIndex.menu,
});

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxHeight: 'min(70vh, var(--available-height))',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '150ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	width: '100%',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: space.xs,
});
