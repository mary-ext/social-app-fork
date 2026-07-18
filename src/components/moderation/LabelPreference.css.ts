import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gridRow: 2,
	gridColumn: '2 / 4',
	gap: space.xs,
	minWidth: 0,
});

export const note = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
});
