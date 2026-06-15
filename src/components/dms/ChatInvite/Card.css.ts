import { style } from '@vanilla-extract/css';

export const row = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
});

export const body = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const metaRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
});

export const ownerRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
});

// the byline pieces share the row and ellipsize independently when the name is long.
export const shrink = style({
	flexShrink: 1,
	minWidth: 0,
});
