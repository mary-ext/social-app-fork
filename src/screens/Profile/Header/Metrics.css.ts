import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});
