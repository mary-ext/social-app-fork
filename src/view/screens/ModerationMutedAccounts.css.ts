import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const emptyContainer = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingTop: space._2xl,
	paddingInline: space.xl,
});

export const emptyBox = style({
	boxSizing: 'border-box',
	maxWidth: 400,
	width: '100%',
	paddingBlock: space.md,
	paddingInline: space.lg,
	backgroundColor: colors.contrast_25,
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.sm,
});

export const info = style({
	display: 'flex',
	boxSizing: 'border-box',
	width: '100%',
	paddingBlock: space.md,
	paddingInline: space.xl,
	backgroundColor: colors.contrast_25,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
});
