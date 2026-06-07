import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const groupBody = style({
	display: 'flex',
	flexDirection: 'column',
	gap: `${space.sm}px`,
	width: '100%',
});
export const headerRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: `${space.sm}px`,
});
