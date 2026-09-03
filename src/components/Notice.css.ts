import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'flex-start',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	backgroundColor: vars.palette.contrast_25,
	padding: space.md,
});

export const icon = style({
	color: vars.palette.contrast_700,
	flexShrink: 0,
	width: iconSize.lg,
	height: iconSize.lg,
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	gap: space._2xs,
	minWidth: 0,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	marginTop: space.sm,
});
