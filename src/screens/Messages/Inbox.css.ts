import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const empty = style({ height: '100%', justifyContent: 'center', paddingBottom: 40 });

export const errorMessage = style({
	maxWidth: 360,
	paddingBottom: space.xl,
});

export const errorTitle = style({
	paddingBottom: space.sm,
	paddingTop: space.md,
});

export const errorWrap = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingTop: space._3xl,
});
