import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const group = style({
	marginBottom: space._2xl,
});

export const header = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const headerIcon = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_25,
	width: 28,
	height: 28,
	color: colors.textContrastMedium,
});

export const icon = style({
	width: iconSize.md,
	height: iconSize.md,
});

export const count = style({
	display: 'inline-flex',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	paddingBlock: space._2xs,
	paddingInline: space.sm,
});

export const seeAll = style({
	gap: space.xs,
	marginInlineStart: 'auto',
	marginInlineEnd: -space.sm,
	marginBlock: -space.xs,
});
