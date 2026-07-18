import { style } from '@vanilla-extract/css';

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	alignItems: 'center',
});

export const body = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const metaRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
});

export const ownerRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	alignItems: 'center',
});

export const shrink = style({
	flexShrink: 1,
	minWidth: 0,
});
