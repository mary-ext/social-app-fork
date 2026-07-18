import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.sm,
	outline: 'none',
	backgroundColor: 'transparent',
	paddingBlock: 8,
	paddingInline: space.md,
	width: '100%',
	textAlign: 'start',
	color: vars.palette.contrast_1000,
	cursor: 'default',
	userSelect: 'none',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const avatar = style({
	marginBlock: (40 - 36) / 2,
});

export const icon = style({
	flexShrink: 0,
	paddingBlock: (20 - 16) / 2,
	color: vars.palette.contrast_500,
});

export const label = style({
	minWidth: 0,
});

export const recentItem = style([row, { paddingInlineEnd: space.sm * 2 + 25 }]);

export const recentRow = style({
	position: 'relative',
});

export const text = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});
