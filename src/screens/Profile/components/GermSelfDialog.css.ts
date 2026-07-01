import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	marginBottom: space.md,
});

export const info = style({
	marginTop: space.sm,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'row-reverse',
	gap: space.md,
	marginTop: space._2xl,
});
