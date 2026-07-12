import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const button = style({
	height: 48,
	width: 48,
});

export const label = style({
	display: 'block',
	paddingTop: space.xs,
});

export const root = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
});
