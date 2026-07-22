import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	padding: space.lg,
});

export const pill = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: space.md,
	borderRadius: borderRadius.full,
	background: colors.contrast_50,
});

export const inner = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	minHeight: 32,
});

export const textColumn = style({
	flex: 1,
	minWidth: 0,
});

export const icon = style({
	marginRight: space.sm,
});

export const action = style({
	appearance: 'none',
	marginInline: space.md,
	padding: 0,
	border: 'none',
	background: 'none',
	textAlign: 'left',
	cursor: 'pointer',
});
