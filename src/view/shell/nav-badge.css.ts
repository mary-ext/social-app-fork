import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const badge = style({
	alignItems: 'center',
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	fontVariantNumeric: 'tabular-nums',
	justifyContent: 'center',
	minWidth: 20,
	paddingBlock: 2,
	paddingInline: 5,
	position: 'absolute',
});

export const hasNewDot = style({
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	height: 8,
	position: 'absolute',
	width: 8,
});
