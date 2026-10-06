import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, fontSize, monoFontFamily, space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const sectionHeader = recipe(
	{
		base: {
			boxSizing: 'border-box',
			margin: 0,
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

export const list = style({
	margin: 0,
});

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: space.md,
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: DIALOG_PADDING,
});

export const keys = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	gap: space.xs,
	margin: 0,
});

export const key = style({
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderBottomWidth: 2,
	borderRadius: borderRadius.xs,
	paddingInline: space.xs,
	minWidth: '1.5rem',
	height: '1.5rem',
	fontFamily: monoFontFamily,
	fontSize: fontSize.sm,
	color: vars.palette.contrast_700,
});
