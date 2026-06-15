import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const unavailable = style({
	alignItems: 'center',
	color: vars.palette.contrast_700,
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
});
