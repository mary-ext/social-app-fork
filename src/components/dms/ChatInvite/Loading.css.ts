import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const loading = style({
	alignItems: 'center',
	color: vars.palette.contrast_1000,
	display: 'flex',
	justifyContent: 'center',
});
