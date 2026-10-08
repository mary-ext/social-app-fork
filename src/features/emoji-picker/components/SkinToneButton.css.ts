import { style } from '@vanilla-extract/css';

import { FIELD_HEIGHT } from '#/components/forms/SearchField.css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { emojiFontFamily, zIndex } from '#/styles/tokens.css';

const INSET = 4;

// keep the inset from the field's 1px border fixed as the font scales.
const TRIGGER_SIZE = `calc(${FIELD_HEIGHT} - ${2 * (1 + INSET)}px)`;

export const trigger = style({
	appearance: 'none',
	display: 'flex',
	flex: '0 0 auto',
	alignItems: 'center',
	justifyContent: 'center',
	// account for the field's 12px padding and slot's -6px margin.
	marginInlineEnd: -(6 - INSET),
	border: '1px solid transparent',
	borderRadius: 8,
	background: 'transparent',
	width: TRIGGER_SIZE,
	height: TRIGGER_SIZE,
	color: vars.palette.contrast_900,
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: vars.palette.contrast_100 },
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
	fontFamily: emojiFontFamily,
	fontSize: 18,
});
