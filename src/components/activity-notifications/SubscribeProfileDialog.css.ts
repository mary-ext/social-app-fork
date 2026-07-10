import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});
