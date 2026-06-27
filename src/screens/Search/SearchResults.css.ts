import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const emptyOuter = style({
	padding: space.xl,
});

export const emptyBox = style({
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	padding: space.lg,
});

export const emptyDivider = style({
	backgroundColor: colorMix(colors.text, '20%'),
	height: 1,
	marginBlock: 12,
	width: '100%',
});

export const profileRow = recipe({
	base: {
		paddingBlock: space.md,
		paddingInline: space.xl,
	},
	variants: {
		topBorder: {
			false: {},
			true: { borderTop: `1px solid ${colors.borderContrastLow}` },
		},
	},
	defaultVariants: { topBorder: true },
});
