import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;

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

export const tabs = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
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
		background: 'transparent',
		border: 'none',
		cursor: 'pointer',
		display: 'block',
		textAlign: 'left',
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
	fontSize: 24,
	lineHeight: 1,
});
