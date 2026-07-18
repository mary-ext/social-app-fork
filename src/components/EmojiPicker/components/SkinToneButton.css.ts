import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

export const trigger = style({
	appearance: 'none',
	display: 'flex',
	flex: '0 0 auto',
	alignItems: 'center',
	justifyContent: 'center',
	border: '1px solid transparent',
	borderRadius: 8,
	background: 'transparent',
	width: 30,
	height: 30,
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_100 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}` },
	},
});

export const positioner = style({
	zIndex: zIndex.popover,
});

export const menu = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	transitionDuration: '150ms',
	transitionProperty: 'opacity',
	outline: 0,
	borderRadius: 10,
	boxShadow: `0 0 0 1px ${vars.palette.contrast_100}, ${vars.shadow.md}`,
	backgroundColor: vars.palette.contrast_0,
	padding: 4,
	maxHeight: 'var(--available-height)',
	overflowY: 'auto',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

export const item = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	outline: 0,
	borderRadius: 8,
	width: 30,
	height: 30,
	cursor: 'pointer',
	userSelect: 'none',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
		'&[data-selected]': { backgroundColor: vars.palette.contrast_100 },
	},
});

export const glyph = style({
	lineHeight: 1,
	fontSize: 18,
});
