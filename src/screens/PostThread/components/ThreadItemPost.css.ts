import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

/** Chrome for the PostHider warning row on the linear thread surface. */
export const hider = style({
	backgroundColor: 'transparent',
	paddingLeft: 0,
	paddingRight: space._2xs,
});

/** Margin on the PostHider icon circle so it lines up with the avatar column. */
export const hiderIcon = style({
	marginRight: space.xs,
});

export const labelsOnMe = style({
	paddingBottom: space.xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});
