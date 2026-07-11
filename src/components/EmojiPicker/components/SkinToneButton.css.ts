import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

export const trigger = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: '1px solid transparent',
	borderRadius: 8,
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	display: 'flex',
	flex: '0 0 auto',
	height: 30,
	justifyContent: 'center',
	width: 30,
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_100 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}` },
	},
});

export const positioner = style({
	zIndex: zIndex.menu,
});

export const menu = style({
	backgroundColor: vars.palette.contrast_0,
	borderRadius: 10,
	boxShadow: `0 0 0 1px ${vars.palette.contrast_100}, ${vars.shadow.md}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	maxHeight: 'var(--available-height)',
	outline: 0,
	overflowY: 'auto',
	padding: 4,
	transitionDuration: '150ms',
	transitionProperty: 'opacity',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

export const item = style({
	alignItems: 'center',
	borderRadius: 8,
	cursor: 'pointer',
	display: 'flex',
	height: 30,
	justifyContent: 'center',
	outline: 0,
	userSelect: 'none',
	width: 30,
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
		'&[data-selected]': { backgroundColor: vars.palette.contrast_100 },
	},
});

export const glyph = style({
	fontSize: 18,
	lineHeight: 1,
});
