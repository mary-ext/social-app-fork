import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
});

export const icon = style({
	flexShrink: 0,
	position: 'relative',
	top: -1,
});

export const label = style({
	flex: 1,
	minWidth: 0,
});

export const loadingName = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 6,
	display: 'inline-block',
	height: 8,
	left: 2,
	position: 'relative',
	top: 1,
	width: 80,
});
