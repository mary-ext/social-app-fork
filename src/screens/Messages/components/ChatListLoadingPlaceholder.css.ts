import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// mirrors chat row padding to align placeholders on the same pitch
export const item = style({
	paddingBlock: space.md,
	paddingInline: space.lg,
});
