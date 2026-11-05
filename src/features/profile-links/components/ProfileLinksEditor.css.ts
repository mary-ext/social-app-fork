import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});
