import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { borderRadius, space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.sm;
const SEARCH_HEIGHT = 42;
// -1 compensates for the search field's 1px bottom border so the list's first row aligns flush beneath it.
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

// pulls the list up so its rows scroll under the search's fading gradient. only when the search sits directly
// above the list — with the member chips in between, the pull would tuck the chips behind the search instead.
export const searchOverlap = style({
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
});

export const list = style({
	paddingBlock: DIALOG_PADDING - ROW_BLOCK_PADDING,
	scrollPaddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

// the matching offset for `searchOverlap`: pad the list back down past the negative margin so the first row
// clears the search, and align scrolled-to rows to the same line.
export const listOverlap = style({
	paddingTop: SEARCH_NEGATIVE_MARGIN,
	scrollPaddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
});

/** body padding for a step with no sticky search slot to offset (e.g. the group-name step). */
export const staticList = style({
	paddingBlock: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

/** a section header separating the list (e.g. "Suggested", "New group chat with:"). */
export const label = style({
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

/** a people row that highlights on hover/keyboard focus. */
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

/** a non-interactive people row (e.g. the read-only member list on the group-name step). */
export const staticRow = style({
	boxSizing: 'border-box',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

/** name column beside the avatar in a people row. */
export const column = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const disabledHeader = style({
	opacity: 0.5,
});

/** fixed-size trailing slot holding the accent checkmark (members) so rows keep a stable height. */
export const indicator = style({
	alignItems: 'center',
	color: colors.primary_500,
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	width: 24,
});

/** the "New group chat" entry point: a highlightable row with a leading avatar-sized glyph and a chevron. */
// the label between the glyph and chevron grows to fill the row, so no justifyContent is needed here.
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

/** the label between the entry-point glyph and the trailing chevron; grows to fill the row. */
export const newGroupChatLabel = style({
	flexGrow: 1,
	minWidth: 0,
});

/** dims a disabled entry point (e.g. group creation blocked for accounts that are too new). */
export const dimmed = style({
	opacity: 0.5,
});

/** horizontally-scrolling row of selected-member chips, pinned above the list while picking members. */
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

/** action bar row inside the pinned footer: back on the left, the primary action on the right. */
export const footerRow = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'space-between',
});

/** wraps the group-name field, mirroring the search slot's placement. */
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
