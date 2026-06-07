import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: `${space.md}px`,
	width: '100%',
});
export const narrow = style({ maxWidth: '400px', width: '100%' });
