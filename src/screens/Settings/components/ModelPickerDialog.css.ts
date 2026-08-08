import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;
const SEARCH_HEIGHT = 42;
const SEARCH_NEGATIVE_MARGIN = SEARCH_HEIGHT + (DIALOG_PADDING - ROW_BLOCK_PADDING - 1);

export const popup = style({
	height: 600,
	maxWidth: 500,
});

export const group = style({
	display: 'contents',
});

export const header = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'space-between',
	backgroundColor: colors.bg,
	paddingTop: DIALOG_PADDING,
	paddingBottom: space.md,
	paddingInline: DIALOG_PADDING,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

export const closeButton = style({
	margin: -space.sm,
});

export const search = style({
	zIndex: zIndex.raised,
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
	backgroundImage: `linear-gradient(${colors.bg} 50%, ${colorMix(colors.bg, '0%')})`,
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
	width: '100%',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
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

export const status = style({
	display: 'block',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.md,
	paddingBlock: 20,
	paddingInline: DIALOG_PADDING,
});

export const emptyMessage = style({
	fontStyle: 'italic',
});

export const doneButton = style({
	width: '100%',
});
