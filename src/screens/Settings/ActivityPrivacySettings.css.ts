import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const body = style({
	paddingInline: space.xl,
	paddingTop: space.md,
});

export const loaderWrap = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingTop: space._5xl,
	width: '100%',
});

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});
