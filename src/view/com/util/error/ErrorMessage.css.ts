import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	backgroundColor: vars.palette.negative_200,
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	padding: 8,
	gap: 8,
});

export const iconBox = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	width: 24,
});

export const message = style({
	flex: 1,
	minWidth: 0,
	paddingRight: 10,
});

export const retry = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	display: 'flex',
	flexShrink: 0,
	justifyContent: 'center',
	height: 24,
	padding: 0,
	width: 24,
});
