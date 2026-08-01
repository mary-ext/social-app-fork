import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

export const note = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
});
