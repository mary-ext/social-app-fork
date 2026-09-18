import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { withAlpha } from '#/styles/functions';
import { iconSize, space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;
const SEARCH_HEIGHT = 42;
const SEARCH_NEGATIVE_MARGIN = SEARCH_HEIGHT + (DIALOG_PADDING - ROW_BLOCK_PADDING - 1);

export const comboboxList = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minHeight: 0,
});

export const search = style({
	zIndex: zIndex.raised,
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
	backgroundImage: `linear-gradient(${colors.bg} 50%, ${withAlpha(colors.bg, '0%')})`,
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

export const list = style({
	paddingTop: SEARCH_NEGATIVE_MARGIN,
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	scrollPaddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
	scrollPaddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const item = style({
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	outline: 'none',
	width: '100%',
	gap: space.md,
	color: colors.text,
	cursor: 'pointer',
	userSelect: 'none',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	selectors: {
		'&[data-highlighted]': { backgroundColor: colors.contrast_25 },
	},
});

export const itemBorder = style({
	position: 'relative',
	'::after': {
		position: 'absolute',
		right: DIALOG_PADDING,
		bottom: 0,
		left: DIALOG_PADDING,
		borderBottom: `1px solid ${colors.borderContrastLow}`,
		content: '""',
	},
});

export const itemText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	gap: space._2xs,
});

export const checkIcon = style({
	color: colors.primary_500,
	width: iconSize.sm,
	height: iconSize.sm,
});

export const status = style({
	display: 'block',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});
