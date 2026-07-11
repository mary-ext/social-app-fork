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

export const searchRow = style({
	paddingInline: space.sm,
	paddingTop: space.sm,
	zIndex: 1,
});

export const searchField = style({
	marginBottom: -SEARCH_INPUT_RADIUS,
});

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
