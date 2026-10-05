import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const center = style({
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: space.xl,
});

export const fill = style({
	flex: 1,
	minHeight: 0,
});
