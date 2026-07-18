import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const button = style({
	width: 48,
	height: 48,
});

export const label = style({
	display: 'block',
	paddingTop: space.xs,
});

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
});
