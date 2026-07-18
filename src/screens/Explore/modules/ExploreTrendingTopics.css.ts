import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

const rowBase = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
	'@media': {
		'(width >= 800px)': {
			paddingInline: space.xl,
		},
	},
});

export const skeletonRow = rowBase;

export const row = style([
	rowBase,
	{
		textDecoration: 'none',
		color: 'inherit',
		cursor: 'pointer',
		':hover': {
			backgroundColor: colors.contrast_25,
		},
	},
]);

export const main = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.xs,
	minWidth: 0,
});

export const titleRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
});

export const rank = style({
	flexShrink: 0,
	width: 20,
});

export const nameText = style({
	flex: 1,
	minWidth: 0,
});

export const metaRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingLeft: 20,
});

export const indicator = style({
	flexShrink: 0,
});

export const pill = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			gap: space.xs,
			alignItems: 'center',
			borderRadius: borderRadius.full,
			paddingInline: 10,
			height: 28,
		},
		variants: {
			type: {
				age: {
					backgroundColor: colors.contrast_25,
					color: colors.textContrastMedium,
				},
				hot: {
					backgroundColor: colors.negative_200,
					color: colors.negative_950,
					selectors: {
						'.theme--light &': {
							backgroundColor: colors.negative_50,
							color: colors.negative_500,
						},
					},
				},
				new: {
					backgroundColor: colors.positive_50,
					color: colors.positive_600,
				},
				skeleton: {
					backgroundColor: colors.contrast_25,
					width: 66,
				},
			},
		},
	},
	{ debugId: 'pill' },
);

export const pillText = style({
	color: 'inherit',
});
