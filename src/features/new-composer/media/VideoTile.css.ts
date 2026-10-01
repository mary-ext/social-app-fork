import { style } from '@vanilla-extract/css';

export const video = style({
	display: 'block',
	width: '100%',
	maxHeight: 360,
	// use 16:9 until intrinsic dimensions are available.
	aspectRatio: 'auto 16 / 9',
	objectFit: 'contain',
	pointerEvents: 'none',
});
