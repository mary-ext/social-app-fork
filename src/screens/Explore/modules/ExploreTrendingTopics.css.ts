import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

const rowBase = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
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
		color: 'inherit',
		cursor: 'pointer',
		textDecoration: 'none',
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	paddingLeft: 20,
});

export const indicator = style({
	flexShrink: 0,
});

export const pill = recipe(
	{
		base: {
			alignItems: 'center',
			borderRadius: borderRadius.full,
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			gap: space.xs,
			height: 28,
			paddingInline: 10,
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
