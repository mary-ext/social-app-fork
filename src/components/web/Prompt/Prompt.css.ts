import { style } from '@vanilla-extract/css';

import { fontSize } from '#/styles/tokens';

import { vars } from '#/styles/contract.css';

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	borderRadius: '20px',
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxWidth: '320px',
	padding: '24px',
	position: 'relative',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	width: '100%',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

export const title = style({
	color: vars.palette.contrast_1000,
	fontSize: `calc(var(--font-scale, 1) * ${fontSize._2xl}px)`,
	fontWeight: 600,
	lineHeight: 1.3,
	margin: 0,
	paddingBottom: '4px',
});

export const description = style({
	color: vars.palette.contrast_900,
	fontSize: `calc(var(--font-scale, 1) * ${fontSize.md}px)`,
	lineHeight: 1.3,
	margin: 0,
	paddingBottom: '16px',
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
	width: '100%',
});
