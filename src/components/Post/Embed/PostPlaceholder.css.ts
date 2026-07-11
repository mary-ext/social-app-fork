import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	marginTop: 8,
	padding: 12,
});

export const icon = style({
	flexShrink: 0,
});
