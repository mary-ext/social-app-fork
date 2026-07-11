import { style } from '@vanilla-extract/css';

export const overLimitColor = '#e60000';

export const container = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	justifyContent: 'space-between',
});

export const count = style({
	flexGrow: 1,
	fontVariantNumeric: 'tabular-nums',
	textAlign: 'right',
});

export const countOver = style({
	color: overLimitColor,
});
