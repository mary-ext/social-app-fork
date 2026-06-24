import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import { PANEL_WIDTH } from './layout';

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
