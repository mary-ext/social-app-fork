import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { recipe } from '#/styles/recipe';
import { space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;
const SEARCH_HEIGHT = 42;
const SEARCH_NEGATIVE_MARGIN = SEARCH_HEIGHT + (DIALOG_PADDING - ROW_BLOCK_PADDING - 1);

export const popup = style({
	maxWidth: 500,
	height: 600,
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

export const sectionHeader = recipe(
	{
		base: {
			display: 'block',
			paddingBottom: space.xs,
			paddingInline: DIALOG_PADDING,
		},
		variants: {
			topPadded: {
				true: {
					paddingTop: space._2xl,
				},
				false: {
					paddingTop: ROW_BLOCK_PADDING,
				},
			},
		},
	},
	{ debugId: 'sectionHeader' },
);

export const item = style({
	boxSizing: 'border-box',
	outlineOffset: -2,
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	width: '100%',
	selectors: {
		[hover(':not([data-disabled])')]: {
			backgroundColor: colors.contrast_25,
		},
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

export const itemLabel = style({
	flex: 1,
	minWidth: 0,
	selectors: {
		'[data-disabled] &': { color: colors.textContrastLow },
	},
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	paddingBlock: space.xl,
	paddingInline: DIALOG_PADDING,
});

export const emptyMessage = style({
	fontStyle: 'italic',
});

export const doneButton = style({
	width: '100%',
});

export const error = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	padding: space.xl,
});
