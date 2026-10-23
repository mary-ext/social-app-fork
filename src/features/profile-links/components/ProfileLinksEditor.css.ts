import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

// match LinkPill sizing.
export const addPill = style({
	borderStyle: 'dashed',
	borderColor: vars.palette.contrast_600,
	paddingBlock: 6,
	paddingRight: 12,
	paddingLeft: 10,
});
