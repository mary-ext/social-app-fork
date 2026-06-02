import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_200}`,
	borderRadius: '12px',
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	maxHeight: '80vh',
	maxWidth: '600px',
	overflow: 'hidden',
	position: 'relative',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	width: '100%',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

/** Scrollable content region below the header. */
export const body = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
});
