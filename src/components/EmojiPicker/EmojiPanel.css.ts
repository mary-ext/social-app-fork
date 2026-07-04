import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

import { PANEL_WIDTH, SEARCH_INPUT_RADIUS } from './layout';

export const panel = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxShadow: vars.shadow.lg,
	boxSizing: 'content-box',
	color: vars.palette.contrast_900,
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	width: PANEL_WIDTH,
});

// the band that insets the search field off the panel edges. a flex item of the panel, so `zIndex` lifts it
// (and its opaque pill) above the grid that slides up underneath.
export const searchRow = style({
	paddingInline: space.sm,
	paddingTop: space.sm,
	zIndex: 1,
});

// pull the grid up under the field by the pill's corner radius so the rounded bottom overlaps the scrolling
// content. assumes the field's border radius equals SEARCH_INPUT_RADIUS.
export const searchField = style({
	marginBottom: -SEARCH_INPUT_RADIUS,
});

// the grid's scroll container reserves a fixed height, so anchor a positioning context to it and
// overlay the empty state instead of stacking it below (which would make the panel taller).
export const list = style({
	position: 'relative',
});

export const empty = style({
	alignItems: 'center',
	color: vars.palette.contrast_500,
	display: 'flex',
	fontSize: 14,
	inset: 0,
	justifyContent: 'center',
	pointerEvents: 'none',
	position: 'absolute',
});
