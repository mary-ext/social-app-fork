import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;

export const group = style({
	display: 'contents',
});

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
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
