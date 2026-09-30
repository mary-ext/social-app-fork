import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: space.md,
});

export const start = style({
	display: 'flex',
});

export const end = style({
	display: 'flex',
});
