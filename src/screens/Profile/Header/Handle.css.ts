import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	maxWidth: '100%',
});

export const noTaps = style({
	pointerEvents: 'none',
});

export const followsYou = style({
	display: 'flex',
	flexShrink: 0,
	borderRadius: 4,
	backgroundColor: vars.palette.contrast_50,
	paddingBlock: 4,
	paddingInline: 8,
});

export const handle = style({
	wordBreak: 'break-all',
});
