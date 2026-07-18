import { style } from '@vanilla-extract/css';

export const overLimitColor = '#e60000';

export const container = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	justifyContent: 'space-between',
});

export const count = style({
	flexGrow: 1,
	textAlign: 'right',
	fontVariantNumeric: 'tabular-nums',
});

export const countOver = style({
	color: overLimitColor,
});
