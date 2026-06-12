import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const popup = style({
	maxWidth: 400,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	marginBottom: space.md,
});

export const errorWrap = style({
	marginTop: space.md,
});
