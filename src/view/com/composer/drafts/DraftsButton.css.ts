import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const trigger = style({
	marginInline: space.xs,
	paddingBlock: space.sm,
	paddingInline: space.md,
});
