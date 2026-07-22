import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: space._2xs,
	marginTop: space.sm,
	marginInline: space.sm,
	padding: space.sm,
	border: `1px solid ${colors.borderContrastHigh}`,
	borderRadius: borderRadius.md,
});

export const textColumn = style({
	flex: 1,
	minWidth: 0,
});

export const italic = style({
	fontStyle: 'italic',
});

export const cancel = style({
	appearance: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingInline: space._2xs,
	border: 'none',
	background: 'none',
	cursor: 'pointer',
});
