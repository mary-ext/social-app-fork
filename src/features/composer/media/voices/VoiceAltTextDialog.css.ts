import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const player = style({
	borderRadius: borderRadius.sm,
	padding: space.sm,
	backgroundColor: vars.palette.contrast_50,
});
