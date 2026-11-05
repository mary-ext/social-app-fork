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

export const handleRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	alignItems: 'center',
	minWidth: 0,
});

export const handle = style({
	minWidth: 0,
	wordBreak: 'break-all',
});

export const pronouns = style({
	flexShrink: 0,
	unicodeBidi: 'isolate',
});
