import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const savedFeedRow = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	flex: 1,
	paddingBlock: space.md,
	paddingInline: space.lg,
	selectors: {
		'&:active': { backgroundColor: colors.contrast_25 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

export const plainRow = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const borderedSection = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
});

export const sectionHeader = recipe(
	{
		base: {
			alignItems: 'center',
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			paddingBottom: space.md,
			paddingInline: space.lg,
			paddingTop: space._2xl,
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
	alignItems: 'center',
	backgroundColor: colors.primary_500,
	borderRadius: 3,
	display: 'flex',
	flexShrink: 0,
	height: 28,
	justifyContent: 'center',
	width: 28,
});

export const searchWrapper = style({
	paddingBottom: space.xs,
	paddingInline: space.lg,
	scrollMarginTop: 56,
});

export const noResults = style({
	paddingBlock: 10,
	paddingBottom: space._5xl,
	paddingInline: space.lg,
});
