import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const popup = style({
	maxWidth: 500,
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
});

export const title = style({
	marginBottom: space.sm,
});

export const heading = style({
	marginBottom: space.sm,
	marginTop: space._2xl,
});

export const body = style({
	marginBottom: space.lg,
});

export const footnote = style({
	marginTop: space._2xl,
});
