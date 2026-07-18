import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const divider = style({
	marginBlock: space.xs,
	marginInline: space.md,
	borderTop: `1px solid ${vars.palette.contrast_100}`,
});
