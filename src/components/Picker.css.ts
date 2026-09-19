import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.sm;

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	scrollPaddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const item = style({
	boxSizing: 'border-box',
	outline: 'none',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	cursor: 'pointer',
	selectors: {
		'&[data-highlighted]': { backgroundColor: colors.contrast_25 },
	},
});

export const indicator = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	width: 24,
	height: 24,
	color: colors.primary_500,
});

export const indicatorInner = style({
	display: 'flex',
});

export const checkIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	paddingBlock: 20,
	paddingInline: DIALOG_PADDING,
});

export const emptyMessage = style({
	fontStyle: 'italic',
});
