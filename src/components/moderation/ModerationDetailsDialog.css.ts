import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const main = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	padding: 20,
});

export const admonition = style({
	marginTop: 16,
});

export const appealRow = style({
	alignItems: 'center',
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	display: 'flex',
	flexWrap: 'wrap',
	gap: 12,
	justifyContent: 'space-between',
	marginTop: 16,
	paddingTop: 16,
});

export const appealHint = style({
	flex: 1,
	minWidth: 180,
});

export const labelBand = style({
	backgroundColor: vars.palette.contrast_25,
	borderBottomLeftRadius: 11,
	borderBottomRightRadius: 11,
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	boxSizing: 'border-box',
	paddingBlock: 12,
	paddingInline: 20,
});

export const sourceRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 20,
	justifyContent: 'space-between',
});

export const sourceText = style({
	flex: 1,
});

export const expires = style({
	flexShrink: 0,
	fontStyle: 'italic',
	marginBlock: (20 - 16) / 2,
});
