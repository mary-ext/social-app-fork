import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	padding: space.xl,
});
