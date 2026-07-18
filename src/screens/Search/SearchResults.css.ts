import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const emptyOuter = style({
	padding: space.xl,
});

export const emptyBox = style({
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	padding: space.lg,
});

export const emptyDivider = style({
	marginBlock: 12,
	backgroundColor: colorMix(colors.text, '20%'),
	width: '100%',
	height: 1,
});
