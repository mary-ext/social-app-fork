import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const banner = style({
	aspectRatio: '3 / 1',
	backgroundColor: colors.contrast_25,
	display: 'block',
	overflow: 'hidden',
	width: '100%',
});

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

export const blurred = style({
	filter: 'blur(100px)',
});

export const labelerFallback = style({
	backgroundColor: 'rgb(105 0 255)',
});
