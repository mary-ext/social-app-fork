import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	width: '100%',
});

export const row = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	paddingBlock: space.xs,
	width: '100%',
});

export const label = style({
	flexGrow: 1,
	minWidth: 0,
});
