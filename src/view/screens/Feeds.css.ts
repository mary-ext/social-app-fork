import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const savedFeedRow = style({
	flex: 1,
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: colors.borderContrastLow,
	paddingBlock: space.md,
	paddingInline: space.lg,
	selectors: {
		'&:active': { backgroundColor: colors.contrast_25 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

export const plainRow = style({
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: colors.borderContrastLow,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const borderedSection = style({
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: colors.borderContrastLow,
});

export const sectionHeader = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			alignItems: 'center',
			paddingTop: space._2xl,
			paddingBottom: space.md,
			paddingInline: space.lg,
		},
		defaultVariants: { bottomBorder: false, first: false },
		variants: {
			bottomBorder: {
				true: { borderBottom: `1px solid ${colors.borderContrastLow}` },
			},
			first: {
				true: { paddingTop: space.lg },
			},
		},
	},
	{ debugId: 'sectionHeader' },
);

export const sectionHeaderIcon = style({
	flexShrink: 0,
	marginLeft: -2,
});

export const sectionHeaderTitle = style({
	flex: 1,
	minWidth: 0,
});

export const followingIcon = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 3,
	backgroundColor: colors.primary_500,
	width: 28,
	height: 28,
});

export const searchWrapper = style({
	paddingBottom: space.xs,
	paddingInline: space.lg,
	scrollMarginTop: 56,
});

export const noResults = style({
	paddingBottom: space._5xl,
	paddingBlock: 10,
	paddingInline: space.lg,
});
