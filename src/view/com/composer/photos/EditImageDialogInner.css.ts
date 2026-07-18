import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const imageBox = style({
	position: 'relative',
	backgroundColor: vars.palette.contrast_50,
	aspectRatio: '1',
	width: '100%',
	overflow: 'hidden',
});

export const cropArea = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	containerType: 'size',
	alignItems: 'center',
	justifyContent: 'center',
});
