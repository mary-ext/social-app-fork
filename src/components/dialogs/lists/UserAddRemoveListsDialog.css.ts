import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const popup = style({
	maxWidth: 500,
	height: 600,
});

export const header = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'space-between',
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	backgroundColor: vars.palette.contrast_0,
	padding: DIALOG_PADDING,
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
			boxSizing: 'border-box',
			backgroundColor: vars.palette.contrast_25,
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
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: DIALOG_PADDING,
});

export const loading = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._5xl,
});

export const noLists = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space._5xl,
	paddingInline: space.xl,
});

export const noListsIcon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_25,
	width: 32,
	height: 32,
});

export const noListsText = style({
	maxWidth: 200,
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
