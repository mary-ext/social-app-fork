import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const banner = style({
	backgroundColor: colors.contrast_25,
	display: 'block',
	height: 150,
	objectFit: 'cover',
	width: '100%',
});

// mirrors the RNW Image blurRadius={100} applied to a moderated banner.
export const blurred = style({
	filter: 'blur(100px)',
});

export const fallback = style({
	backgroundColor: colors.contrast_25,
	height: 150,
	width: '100%',
});

// labeler accounts get a solid purple banner when they have no image — matches `temp_purple`.
export const labelerFallback = style({
	backgroundColor: 'rgb(105 0 255)',
});
