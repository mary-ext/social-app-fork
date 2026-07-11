import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const row = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	maxWidth: '100%',
});

export const noTaps = style({
	pointerEvents: 'none',
});

export const followsYou = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 4,
	display: 'flex',
	flexShrink: 0,
	paddingBlock: 4,
	paddingInline: 8,
});

export const handle = style({
	wordBreak: 'break-all',
});
