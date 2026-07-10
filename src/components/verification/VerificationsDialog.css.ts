import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const nameColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const cardRow = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
});
