import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// keeps the Popup's flex column intact; the wrapper only exists to catch Escape.
export const root = style({
	display: 'contents',
});

export const leadingButton = style({
	margin: -space.sm,
});
