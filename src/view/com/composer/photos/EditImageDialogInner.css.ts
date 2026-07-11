import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const imageBox = style({
	aspectRatio: '1',
	backgroundColor: vars.palette.contrast_50,
	overflow: 'hidden',
	position: 'relative',
	width: '100%',
});

export const cropArea = style({
	alignItems: 'center',
	containerType: 'size',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});
