import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import {
	GRID_HEIGHT,
	GRID_PADDING,
	GRID_PADDING_BOTTOM,
	HEADER_HEIGHT,
	PER_LINE,
	ROW_HEIGHT,
	SEARCH_INPUT_RADIUS,
} from '../layout';

export const scroll = style({
	position: 'relative',
	paddingInline: GRID_PADDING,
	height: GRID_HEIGHT,
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	scrollPaddingTop: GRID_PADDING + SEARCH_INPUT_RADIUS,
	scrollPaddingBottom: GRID_PADDING,
	userSelect: 'none',
});

export const spacer = style({
	position: 'relative',
	paddingBottom: GRID_PADDING_BOTTOM,
	width: '100%',
});

export const header = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	right: 0,
	left: 0,
	alignItems: 'end',
	paddingBottom: 4,
	paddingInline: 6,
	height: HEADER_HEIGHT,
});

export const row = style({
	display: 'grid',
	position: 'absolute',
	right: 0,
	left: 0,
	gridTemplateColumns: `repeat(${PER_LINE}, 1fr)`,
	height: ROW_HEIGHT,
});

export const cell = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	outline: 'none',
	border: 'none',
	borderRadius: 8,
	background: 'transparent',
	padding: 0,
	height: ROW_HEIGHT,
	cursor: 'pointer',
	selectors: {
		'&:hover, &[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
	},
});

export const glyph = style({
	lineHeight: 1,
	fontSize: 20,
});
