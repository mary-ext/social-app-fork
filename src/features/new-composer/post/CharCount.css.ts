import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
});

export const count = style({
	fontVariantNumeric: 'tabular-nums',
});
