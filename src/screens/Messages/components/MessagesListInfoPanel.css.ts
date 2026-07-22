import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
});

export const nameRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space.xs,
	marginTop: space.lg,
});

export const handle = style({
	marginTop: space.xs,
});

export const labels = style({
	marginTop: space.xs,
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space.sm,
	marginTop: space.lg,
	marginBottom: space._4xl,
});
