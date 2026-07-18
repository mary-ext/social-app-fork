import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const row = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
	justifyContent: 'space-between',
	backgroundColor: vars.palette.contrast_0,
	paddingBottom: space.md,
});
