import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const borderedSection = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
});

export const sectionHeader = style({
	display: 'flex',
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingTop: space._2xl,
	paddingBottom: space.md,
	paddingInline: space.lg,
});

export const about = style({
	paddingBlock: space.xl,
	paddingInline: space.lg,
});

export const emptyDropZone = recipe(
	{
		base: {
			transition: 'background-color 0.15s, border-color 0.15s',
			margin: space.lg,
			border: `2px dashed ${colors.borderContrastMedium}`,
			borderRadius: borderRadius.md,
		},
		variants: {
			active: {
				true: {
					borderColor: colors.primary_500,
					backgroundColor: colors.primary_25,
				},
			},
		},
	},
	{ debugId: 'emptyDropZone' },
);
