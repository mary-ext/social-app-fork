import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const box = style({
	boxSizing: 'border-box',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 8,
	borderColor: vars.palette.contrast_100,
	padding: 12,
});

export const available = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	justifyContent: 'space-between',
});
