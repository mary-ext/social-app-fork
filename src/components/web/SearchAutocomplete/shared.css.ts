import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// shared interactive row: laid out left-to-right, highlighted via Base UI's data attribute.
export const row = style({
	backgroundColor: 'transparent',
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	cursor: 'default',
	display: 'flex',
	gap: space.sm,
	outline: 'none',
	paddingBlock: 8,
	paddingInline: space.md,
	textAlign: 'start',
	userSelect: 'none',
	width: '100%',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const avatar = style({
	marginBlock: (40 - 36) / 2,
});

export const icon = style({
	color: vars.palette.contrast_500,
	paddingBlock: (20 - 16) / 2,
	flexShrink: 0,
});

// let the label shrink within the flex row and break long unbroken values (e.g. a pasted URL) instead of overflowing.
export const label = style({
	minWidth: 0,
	overflowWrap: 'break-word',
});

// a recent-history row: the base row with trailing room reserved for the floating remove button so long
// values don't run under it.
export const recentItem = style([row, { paddingInlineEnd: 44 }]);

// the recent row's positioning context, anchoring its absolutely-placed remove button.
export const recentRow = style({
	position: 'relative',
});

export const text = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});
