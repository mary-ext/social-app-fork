import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const loading = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	color: vars.palette.contrast_1000,
});
