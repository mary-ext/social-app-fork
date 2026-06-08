import { style } from '@vanilla-extract/css';

export const doneRow = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	marginTop: 8,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const sections = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
	marginBlock: 12,
});
