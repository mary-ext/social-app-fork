import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const popup = style({
	height: 600,
	maxWidth: 500,
});

export const header = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	justifyContent: 'space-between',
	padding: DIALOG_PADDING,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

export const closeButton = style({
	margin: -space.sm,
});

export const sectionHeader = recipe(
	{
		base: {
			backgroundColor: vars.palette.contrast_25,
			boxSizing: 'border-box',
			paddingBlock: space.xs,
			paddingInline: DIALOG_PADDING,
		},
		variants: {
			topBorder: {
				true: {
					borderTop: `1px solid ${colors.borderContrastLow}`,
				},
			},
		},
	},
	{ debugId: 'sectionHeader' },
);

export const row = style({
	boxSizing: 'border-box',
	paddingBlock: space.md,
	paddingInline: DIALOG_PADDING,
	borderTop: `1px solid ${colors.borderContrastLow}`,
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: space._5xl,
});

export const noLists = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingInline: space.xl,
	paddingTop: space._5xl,
});

export const noListsIcon = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 999,
	display: 'flex',
	height: 32,
	justifyContent: 'center',
	width: 32,
});

export const noListsText = style({
	maxWidth: 200,
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
