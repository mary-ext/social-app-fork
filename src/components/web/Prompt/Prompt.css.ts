import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_200}`,
	borderRadius: 20,
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxWidth: 320,
	padding: 24,
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
	fontSize: fontSize._2xl,
	fontWeight: 600,
	lineHeight: 1.3,
	margin: 0,
	paddingBottom: 4,
});

export const description = style({
	color: vars.palette.contrast_900,
	fontSize: fontSize.md,
	lineHeight: 1.3,
	margin: 0,
	paddingBottom: 16,
});

export const content = style({
	paddingBottom: 8,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
	width: '100%',
});
