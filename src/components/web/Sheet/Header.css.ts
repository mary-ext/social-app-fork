import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderBottom: `1px solid ${vars.palette.contrast_200}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: '8px',
	minHeight: '52px',
	paddingBlock: '8px',
	paddingInline: '12px',
});

export const content = style({
	display: 'flex',
	flex: 1,
	justifyContent: 'center',
	minWidth: 0,
});

export const slot = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
});
