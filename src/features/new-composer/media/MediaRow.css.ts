import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from '../layout';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingTop: space.md,
	paddingRight: RIGHT_PADDING,
});
