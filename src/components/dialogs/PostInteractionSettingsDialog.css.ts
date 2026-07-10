import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const form = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const replySection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const replyBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const disabledNotice = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 8,
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	paddingBlock: 8,
	paddingInline: 12,
});

export const disabledNoticeIcon = style({ flexShrink: 0 });

export const flex1 = style({ flex: 1 });

export const radioRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
});

export const persistRow = style({
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	minHeight: 24,
});

export const listsCount = style({
	fontStyle: 'italic',
	fontWeight: 400,
});

export const saveButton = style({ width: '100%' });
