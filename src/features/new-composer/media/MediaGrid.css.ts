import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const grid = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
	gap: space.xs,
});
