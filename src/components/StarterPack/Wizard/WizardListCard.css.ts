import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// `min-width: 0` lets the name/handle ellipsize instead of overrunning the row (flex items default to
// `min-width: auto`, which floors at content width and defeats the single-line clamp).
export const textCol = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});
