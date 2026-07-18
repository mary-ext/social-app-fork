import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const badge = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 4,
	display: 'inline-flex',
	paddingBlock: 3,
	paddingInline: 6,
});
