import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const main = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
});

export const title = style({
	marginBottom: 4,
});

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
});

export const card = style({
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
});

export const cardTop = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
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
	backgroundColor: vars.palette.contrast_25,
	boxSizing: 'border-box',
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

export const appealHeader = style({
	display: 'flex',
	flexDirection: 'column',
});

export const appealError = style({
	marginTop: 8,
});

export const appealInput = style({
	marginBlock: 12,
});
