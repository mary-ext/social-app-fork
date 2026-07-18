import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;

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

export const tabs = style({
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: colors.borderContrastLow,
	paddingBottom: DIALOG_PADDING,
});

export const list = style({
	paddingBlock: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const row = style({
	boxSizing: 'border-box',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	width: '100%',
});

export const rowButton = style([
	row,
	{
		appearance: 'none',
		display: 'block',
		border: 'none',
		background: 'transparent',
		textAlign: 'left',
		cursor: 'pointer',
		selectors: {
			'&:hover': { backgroundColor: colors.contrast_25 },
			'&:focus-visible': { outline: `2px solid ${colors.primary_500}`, outlineOffset: -2 },
		},
	},
]);

/** Name column: takes the free space beside the avatar and truncates, pushing the emoji to the row's end. */
export const nameColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const emojiGlyph = style({
	flexShrink: 0,
	lineHeight: 1,
	fontSize: 24,
});
