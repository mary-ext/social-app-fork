import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const footer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	paddingBlock: space.xl,
});
