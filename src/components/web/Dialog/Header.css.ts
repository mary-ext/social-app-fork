import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderBottom: `1px solid ${vars.palette.contrast_200}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: 8,
	minHeight: 50,
	paddingBlock: 6,
	paddingInline: 6,
});

export const borderless = style({
	borderBottom: 'none',
});

export const content = style({
	flex: '0 1 auto',
	minWidth: 0,
});

export const slot = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	selectors: {
		'&:first-child': { justifyContent: 'flex-start' },
		'&:last-child': { justifyContent: 'flex-end' },
	},
});
