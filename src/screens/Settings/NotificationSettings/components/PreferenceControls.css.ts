import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
});

export const filter = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const loaderWrap = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingTop: space._5xl,
	width: '100%',
});
