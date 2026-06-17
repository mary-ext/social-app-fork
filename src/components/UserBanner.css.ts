import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

// clips the blurred image's halo (`filter: blur()` paints past the element's own box, so the image
// can't clip itself) and backs its translucent rim with an opaque fill (blur samples transparent
// pixels past the edge). doubles as the solid fallback when the profile has no banner.
export const banner = style({
	backgroundColor: colors.contrast_25,
	display: 'block',
	height: 150,
	overflow: 'hidden',
	width: '100%',
});

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

// mirrors the RNW Image blurRadius={100} applied to a moderated banner; clipped to shape by {@link banner}.
export const blurred = style({
	filter: 'blur(100px)',
});

// labeler accounts get a solid purple banner when they have no image — matches `temp_purple`.
export const labelerFallback = style({
	backgroundColor: 'rgb(105 0 255)',
});
