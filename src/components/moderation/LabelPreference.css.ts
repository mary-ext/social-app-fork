import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	gridColumn: '2 / 4',
	gridRow: 2,
	minWidth: 0,
});

export const note = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
});
