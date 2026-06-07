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
	gap: 8,
	minHeight: 50,
	paddingBlock: 6,
	paddingInline: 6,
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
