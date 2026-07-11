import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const header = style({
	transition: 'box-shadow 0.15s ease',
	boxShadow: '0 1px 0 0 transparent',
});

export const headerScrolled = style({
	boxShadow: `0 1px 0 0 ${vars.palette.contrast_200}`,
});

export const publishingRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	paddingRight: 14,
	gap: 12,
});

export const buttonRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
});
