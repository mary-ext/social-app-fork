import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// spacing below the search field, before the category pills.
export const root = style({
	paddingBottom: space.md,
});
