import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

/** Trailing breathing room below the last row so it doesn't sit flush against the popup's bottom edge. */
export const list = style({
	paddingBottom: space.lg,
});
