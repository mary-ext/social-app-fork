import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const banner = style({
	display: 'block',
	backgroundColor: colors.contrast_25,
	aspectRatio: '3 / 1',
	width: '100%',
	overflow: 'hidden',
});

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const blurred = style({
	filter: 'blur(100px)',
});

export const labelerFallback = style({
	backgroundColor: 'rgb(105 0 255)',
});
