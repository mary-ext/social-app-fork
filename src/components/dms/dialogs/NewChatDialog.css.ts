import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

import { row } from './MemberPicker.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.sm;

export const staticList = style({
	paddingBlock: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const staticRow = style({
	boxSizing: 'border-box',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
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
