import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	marginBlock: space.xs,
	marginInline: space.md,
});
