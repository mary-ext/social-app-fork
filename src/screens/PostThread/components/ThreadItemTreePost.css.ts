import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

/** Margin on the PostHider icon circle on the tree thread surface. */
export const hiderIcon = style({
	marginLeft: 2,
	marginRight: 2,
});

export const labelsOnMe = style({
	paddingBottom: space._2xs,
});

export const postAlerts = style({
	paddingBottom: space._2xs,
});
