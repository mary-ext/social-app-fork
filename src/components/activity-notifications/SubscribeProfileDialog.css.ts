import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const popup = style({
	maxWidth: 400,
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});
