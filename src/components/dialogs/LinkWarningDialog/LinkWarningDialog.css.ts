import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const linkBox = style({
	border: `1px solid ${vars.palette.contrast_200}`,
	borderRadius: 8,
	paddingBlock: 10,
	paddingInline: 12,
});

export const loadingBox = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: 188,
});
