import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const container = style({
	flex: 1,
	paddingBlock: '12px',
});

export const group = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: '4px',
	paddingBlock: '8px',
	paddingInline: '20px',
	width: '100%',
});

export const itemIcon = style({
	color: vars.palette.contrast_1000,
	display: 'flex',
	flexShrink: 0,
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	marginBlock: '8px',
	width: '100%',
});
