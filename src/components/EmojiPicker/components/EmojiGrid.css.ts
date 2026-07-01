import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import {
	GRID_HEIGHT,
	GRID_PADDING,
	GRID_PADDING_BOTTOM,
	HEADER_HEIGHT,
	PER_LINE,
	ROW_HEIGHT,
} from '../layout';

export const scroll = style({
	height: GRID_HEIGHT,
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	paddingInline: GRID_PADDING,
	position: 'relative',
	scrollPadding: GRID_PADDING,
	userSelect: 'none',
});

export const spacer = style({
	// the grid is virtualized, so its height is set explicitly rather than driven by flow content;
	// pad below the last row here so the bottom gap survives scrolling to the end.
	paddingBottom: GRID_PADDING_BOTTOM,
	position: 'relative',
	width: '100%',
});

export const header = style({
	alignItems: 'end',
	boxSizing: 'border-box',
	display: 'flex',
	height: HEADER_HEIGHT,
	left: 0,
	paddingBottom: 4,
	paddingInline: 6,
	position: 'absolute',
	right: 0,
});

export const row = style({
	display: 'grid',
	gridTemplateColumns: `repeat(${PER_LINE}, 1fr)`,
	height: ROW_HEIGHT,
	left: 0,
	position: 'absolute',
	right: 0,
});

export const cell = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: 8,
	cursor: 'pointer',
	display: 'flex',
	height: ROW_HEIGHT,
	justifyContent: 'center',
	outline: 'none',
	padding: 0,
	selectors: {
		'&:hover, &[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
	},
});

export const glyph = style({
	fontSize: 20,
	lineHeight: 1,
});
