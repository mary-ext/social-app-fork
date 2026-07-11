import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const errorText = style({ marginTop: space.sm });

export const field = style({
	marginTop: space.xs,
	marginBottom: space.md,
});
