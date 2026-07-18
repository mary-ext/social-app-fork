import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const empty = style({ justifyContent: 'center', paddingBottom: 40, height: '100%' });

export const errorMessage = style({
	paddingBottom: space.xl,
	maxWidth: 360,
});

export const errorTitle = style({
	paddingTop: space.md,
	paddingBottom: space.sm,
});

export const errorWrap = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingTop: space._3xl,
});
