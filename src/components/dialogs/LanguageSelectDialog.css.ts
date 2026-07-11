import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const group = style({
	display: 'contents',
});

export const header = style({
	backgroundColor: vars.palette.contrast_0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
	flexShrink: 0,
	paddingBottom: 4,
	paddingInline: 24,
	paddingTop: 24,
});

export const headerRow = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	gap: 8,
});

export const titleBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const list = style({
	paddingBottom: 24,
	paddingInline: 24,
});

export const sectionHeader = style({
	display: 'block',
	paddingBottom: 12,
	paddingTop: 28,
});

export const row = style({
	boxSizing: 'border-box',
	paddingBlock: 12,
});

export const rowBorder = style({
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
});

export const rowLabel = style({
	flex: 1,
	selectors: {
		'[data-disabled] &': { color: vars.palette.contrast_400 },
	},
});

export const doneButton = style({
	width: '100%',
});

export const error = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	padding: 20,
});
