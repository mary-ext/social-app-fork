import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const item = style({
	paddingBlock: space.md,
	paddingInline: space.lg,
});
