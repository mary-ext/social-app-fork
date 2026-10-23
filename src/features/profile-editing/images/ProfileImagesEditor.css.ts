import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const root = style({
	position: 'relative',
});

export const avatar = style({
	boxSizing: 'border-box',
	position: 'absolute',
	top: 80,
	left: 20,
	borderWidth: 2,
	borderStyle: 'solid',
	borderRadius: 42,
	borderColor: vars.palette.contrast_0,
	width: 84,
	height: 84,
});
