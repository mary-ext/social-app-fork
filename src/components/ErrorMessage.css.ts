import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	backgroundColor: vars.palette.negative_200,
	padding: 8,
});

export const iconBox = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	width: 24,
	height: 24,
});

export const message = style({
	flex: 1,
	paddingRight: 10,
	minWidth: 0,
});

export const retry = style({
	appearance: 'none',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	border: 'none',
	background: 'none',
	padding: 0,
	width: 24,
	height: 24,
	cursor: 'pointer',
});
