import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const header = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});
