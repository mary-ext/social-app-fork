import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.sm;

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	scrollPaddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const label = style({
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});

export const row = style({
	boxSizing: 'border-box',
	outline: 'none',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	cursor: 'pointer',

	selectors: {
		[`${label} + &`]: {
			scrollMarginTop: space.lg + space.sm,
		},

		'&[data-disabled]': { cursor: 'default' },
		'&[data-highlighted]': { backgroundColor: colors.contrast_25 },
	},
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
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	width: 24,
	height: 24,
	color: colors.primary_500,
});

export const chips = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	gap: space.sm,
	backgroundColor: colors.bg,
	paddingTop: space.xs,
	paddingBottom: DIALOG_PADDING,
	paddingInline: DIALOG_PADDING,
	overflowX: 'auto',
	scrollbarWidth: 'none',
});

export const chip = recipe(
	{
		base: {
			display: 'flex',
			flexShrink: 0,
			alignItems: 'center',
			border: `1px solid ${colors.contrast_100}`,
			borderRadius: borderRadius.full,
			paddingBlock: space.xs,
			paddingInlineStart: space.xs,
			paddingInlineEnd: space.xs,
			maxWidth: 200,
		},
		variants: {
			labeler: {
				true: { paddingInlineStart: space.sm },
			},
		},
	},
	{ debugId: 'chip' },
);

export const chipName = style({
	marginRight: space.xs,
	marginLeft: space.sm,
	minWidth: 0,
});

export const chipRemove = style({
	flexShrink: 0,
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

export const checkIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
});
