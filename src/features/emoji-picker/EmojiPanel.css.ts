import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

import { PANEL_WIDTH, SEARCH_INPUT_RADIUS } from './layout';

export const panel = style({
	boxSizing: 'content-box',
	display: 'flex',
	flexDirection: 'column',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	width: PANEL_WIDTH,
	overflow: 'hidden',
	color: vars.palette.contrast_900,
});

export const searchRow = style({
	zIndex: 1,
	paddingTop: space.sm,
	paddingInline: space.sm,
});

export const searchField = style({
	marginBottom: -SEARCH_INPUT_RADIUS,
});

export const list = style({
	position: 'relative',
});

export const empty = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.palette.contrast_500,
	fontSize: 14,
	pointerEvents: 'none',
});
