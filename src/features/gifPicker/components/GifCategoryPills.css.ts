import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	display: 'flex',
	gap: space.xs,
	justifyContent: 'space-between',
	paddingBottom: space.md,
});
