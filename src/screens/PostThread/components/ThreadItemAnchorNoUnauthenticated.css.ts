import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	padding: space.lg,
});

export const text = style({
	fontStyle: 'italic',
});
