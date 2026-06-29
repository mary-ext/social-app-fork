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
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	justifyContent: 'space-between',
	padding: DIALOG_PADDING,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

// pull the ghost close button flush with the dialog edge.
export const closeButton = style({
	margin: -space.sm,
});

// the top border separates rows; suppressed on the first row so it doesn't double up under the header.
export const item = recipe(
	{
		base: {
			alignItems: 'center',
			boxSizing: 'border-box',
			display: 'flex',
			gap: space.md,
			justifyContent: 'space-between',
			paddingBlock: space.md,
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
	{ debugId: 'starterPackItem' },
);

export const itemInfo = style({
	flex: 1,
	minWidth: 0,
});

export const itemMeta = style({
	alignItems: 'center',
	display: 'flex',
	marginTop: space.xs,
});

export const moreCount = style({
	marginLeft: space.xs,
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: space._5xl,
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	paddingInline: space.xl,
	paddingTop: space._5xl,
});

export const emptyText = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	maxWidth: 260,
});
