import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const card = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	overflow: 'hidden',
});

export const cardTop = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'flex-start',
	padding: 12,
});

export const cardInfo = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 4,
	minWidth: 0,
});

export const band = style({
	boxSizing: 'border-box',
	backgroundColor: vars.palette.contrast_25,
	paddingBlock: 8,
	paddingInline: 12,
});

export const sourceRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 20,
	justifyContent: 'space-between',
	paddingBottom: 1,
});

export const sourceText = style({
	flex: 1,
	minWidth: 0,
});

export const expires = style({
	flexShrink: 0,
	fontStyle: 'italic',
});
