import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const emptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.xl,
});
