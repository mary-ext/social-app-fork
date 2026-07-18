import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const skeleton = style({
	borderRadius: 12,
	backgroundColor: vars.palette.contrast_25,
	width: '100%',
	height: 68,
});
