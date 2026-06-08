import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const center = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xl,
});

// fills the available height of a flex-column parent so the spinner sits in the vertical center of an
// otherwise-empty region.
export const fill = style({
	flex: 1,
	minHeight: 0,
});
