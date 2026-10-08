import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { iconSize, space } from '#/styles/tokens.css';

/** row padding override for touch layouts. */
export const rowBlock = createVar();
/** shared inset for rows, labels and dividers. */
export const rowInset = createVar();

export const rowBlockPadding = fallbackVar(rowBlock, '8px');
export const rowInsetPadding = fallbackVar(rowInset, `${space.md}px`);

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.sm,
	outline: 'none',
	backgroundColor: 'transparent',
	paddingBlock: rowBlockPadding,
	paddingInline: rowInsetPadding,
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
	width: iconSize.sm,
	height: iconSize.sm,
	paddingBlock: (20 - 16) / 2,
	color: vars.palette.contrast_500,
});

export const label = style({
	minWidth: 0,
});

/** matches Button size="tiny", in pixels. */
export const REMOVE_BUTTON_SIZE = 25;
// offset the button's padding to align its icon with the row inset.
export const removeButtonEnd = `calc(${rowInsetPadding} - 4px)`;

export const recentItem = style([
	row,
	{ paddingInlineEnd: `calc(${removeButtonEnd} + ${REMOVE_BUTTON_SIZE + space.sm}px)` },
]);

export const recentRow = style({
	position: 'relative',
});

export const text = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});
