import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
});

export const name = style({
	marginTop: space.lg,
	paddingInline: space.lg,
});

export const names = style({
	marginTop: space.xs,
	paddingInline: space.lg,
});

export const namesBottom = style({
	marginBottom: space._4xl,
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
