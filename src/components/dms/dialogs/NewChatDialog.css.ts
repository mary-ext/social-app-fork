import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { borderRadius, space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.sm;
const SEARCH_HEIGHT = 42;
const SEARCH_NEGATIVE_MARGIN = SEARCH_HEIGHT + (DIALOG_PADDING - ROW_BLOCK_PADDING - 1);

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
	paddingInline: DIALOG_PADDING,
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	zIndex: zIndex.sticky,
});

export const searchOverlap = style({
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
});

export const list = style({
	paddingBlock: DIALOG_PADDING - ROW_BLOCK_PADDING,
	scrollPaddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const listOverlap = style({
	paddingTop: SEARCH_NEGATIVE_MARGIN,
	scrollPaddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
});

export const staticList = style({
	paddingBlock: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const label = style({
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

export const row = style({
	boxSizing: 'border-box',
	cursor: 'pointer',
	outline: 'none',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,

	selectors: {
		[`${label} + &`]: {
			scrollMarginTop: space.lg + space.sm,
		},

		'&[data-disabled]': { cursor: 'default' },
		'&[data-highlighted]': { backgroundColor: colors.contrast_25 },
	},
});

export const staticRow = style({
	boxSizing: 'border-box',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

export const column = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const disabledHeader = style({
	opacity: 0.5,
});

export const indicator = style({
	alignItems: 'center',
	color: colors.primary_500,
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	width: 24,
});

export const newGroupChat = style([
	row,
	{
		alignItems: 'center',
		display: 'flex',
		gap: space.md,
	},
]);

export const newGroupChatIcon = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.full,
	display: 'flex',
	flexShrink: 0,
	height: 40,
	justifyContent: 'center',
	width: 40,
});

export const newGroupChatLabel = style({
	flexGrow: 1,
	minWidth: 0,
});

export const dimmed = style({
	opacity: 0.5,
});

export const chips = style({
	backgroundColor: colors.bg,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	gap: space.sm,
	overflowX: 'auto',
	paddingBottom: space.sm,
	paddingInline: DIALOG_PADDING,
	scrollbarWidth: 'none',
});

export const chip = style({
	alignItems: 'center',
	border: `1px solid ${colors.contrast_100}`,
	borderRadius: borderRadius.full,
	display: 'flex',
	flexShrink: 0,
	maxWidth: 200,
	paddingBlock: space.xs,
	paddingInlineEnd: space.xs,
	paddingInlineStart: space.xs,
});

export const chipName = style({
	minWidth: 0,
	marginLeft: space.sm,
	marginRight: space.xs,
});

export const chipRemove = style({
	flexShrink: 0,
});

export const footerRow = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'space-between',
});

export const groupNameSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingBottom: space.md,
	paddingInline: DIALOG_PADDING,
});

export const error = style({
	color: colors.negative_400,
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
