import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { emojiFontFamily } from '#/styles/tokens.css';

import {
	GRID_HEIGHT,
	GRID_PADDING,
	GRID_PADDING_BOTTOM,
	GRID_SCROLL_PADDING_BOTTOM,
	GRID_SCROLL_PADDING_TOP,
	HEADER_HEIGHT,
	PER_LINE,
	ROW_HEIGHT,
} from '../layout';

export const scroll = style({
	position: 'relative',
	paddingInline: GRID_PADDING,
	height: GRID_HEIGHT,
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	scrollPaddingTop: GRID_SCROLL_PADDING_TOP,
	scrollPaddingBottom: GRID_SCROLL_PADDING_BOTTOM,
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
		[`&[data-highlighted]`]: {
			backgroundColor: vars.palette.contrast_50,
		},
	},
});

export const glyph = style({
	lineHeight: 1,
	fontFamily: emojiFontFamily,
	fontSize: 20,
});
