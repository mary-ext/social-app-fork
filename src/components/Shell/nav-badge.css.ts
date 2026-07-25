import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const badge = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 999,
	backgroundColor: vars.palette.primary_500,
	paddingBlock: 2,
	paddingInline: 5,
	minWidth: 20,
	fontVariantNumeric: 'tabular-nums',
});

export const hasNewDot = style({
	position: 'absolute',
	borderRadius: 999,
	backgroundColor: vars.palette.primary_500,
	width: 8,
	height: 8,
});
