import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const unavailable = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	color: vars.palette.contrast_700,
});
