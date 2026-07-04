import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.sm;
const SEARCH_HEIGHT = 42;
const SEARCH_NEGATIVE_MARGIN = SEARCH_HEIGHT + (DIALOG_PADDING - ROW_BLOCK_PADDING);

export const popup = style({
	height: 600,
	maxWidth: 500,
});

export const header = style({
	alignItems: 'center',
	backgroundColor: colors.bg,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	justifyContent: 'space-between',
	paddingBottom: space.md,
	paddingInline: DIALOG_PADDING,
	paddingTop: DIALOG_PADDING,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

export const closeButton = style({
	margin: -space.sm,
});

export const search = style({
	backgroundImage: `linear-gradient(${colors.bg} 50%, ${colorMix(colors.bg, '0%')})`,
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
	paddingInline: DIALOG_PADDING,
	zIndex: zIndex.sticky,
});

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	paddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
});

/** a full-width, pressable people row that highlights on hover/press/focus and dims when disabled. */
export const row = style({
	background: 'none',
	border: 'none',
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'block',
	font: 'inherit',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	textAlign: 'start',
	width: '100%',

	selectors: {
		'&:not(:disabled):active': { backgroundColor: colors.contrast_25 },
		'&:not(:disabled):focus-visible': { backgroundColor: colors.contrast_25 },
		'&:not(:disabled):hover': { backgroundColor: colors.contrast_25 },
		'&:disabled': { cursor: 'default', opacity: 0.5 },
	},
});

/** name column beside the avatar in a people row. */
export const column = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: 20,
	paddingInline: DIALOG_PADDING,
});

export const emptyMessage = style({
	fontStyle: 'italic',
});
