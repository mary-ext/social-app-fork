import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const badge = style({
	display: 'inline-flex',
	alignItems: 'center',
	borderRadius: 4,
	backgroundColor: vars.palette.contrast_50,
	paddingBlock: 3,
	paddingInline: 6,
});
