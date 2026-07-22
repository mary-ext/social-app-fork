import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: space.xl,
	gap: space.md,
});

export const text = style({
	maxWidth: 310,
});
