import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// the composer-footer trigger keeps its bespoke gutters from the RNW original.
export const trigger = style({
	marginInline: space.xs,
	paddingBlock: space.sm,
	paddingInline: space.md,
});
