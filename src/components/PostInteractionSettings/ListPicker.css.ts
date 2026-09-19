import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const hint = style({
	display: 'block',
	paddingTop: space.md,
	paddingBottom: space.xs,
	paddingInline: space.lg,
});
