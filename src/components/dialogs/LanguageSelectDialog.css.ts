import { style } from '@vanilla-extract/css';

import { ROW_LABEL_INSET, ROW_PADDING_BLOCK } from '#/components/Settings.css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const group = style({
	display: 'contents',
});

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_PADDING_BLOCK,
	scrollPaddingBottom: DIALOG_PADDING - ROW_PADDING_BLOCK,
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
					paddingTop: ROW_PADDING_BLOCK,
				},
			},
		},
	},
	{ debugId: 'sectionHeader' },
);

export const itemBorder = style({
	position: 'relative',
	'::after': {
		position: 'absolute',
		right: DIALOG_PADDING,
		bottom: 0,
		left: ROW_LABEL_INSET,
		borderBottom: `1px solid ${colors.borderContrastLow}`,
		content: '""',
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
