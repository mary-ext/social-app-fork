import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const actions = style({
	display: 'flex',
	gap: 8,
	justifyContent: 'flex-end',
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const linkBox = style({
	border: `1px solid ${vars.palette.contrast_200}`,
	borderRadius: 8,
	paddingBlock: 10,
	paddingInline: 12,
});

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 24,
});
