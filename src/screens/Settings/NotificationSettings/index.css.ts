import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const errorWrap = style({
	paddingBottom: space.md,
	paddingInline: space.lg,
});

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});
