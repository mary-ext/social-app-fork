import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({
	position: 'absolute',
	left: space.xl,
	right: space.xl,
	zIndex: 50,
});

export const pill = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	border: `1px solid ${colors.primary_100}`,
	borderRadius: borderRadius.full,
	background: colors.primary_50,
});

export const main = style({
	appearance: 'none',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	padding: space.lg,
	border: 'none',
	background: 'none',
	textAlign: 'left',
	cursor: 'pointer',
});

export const label = style({
	flex: 1,
	marginLeft: space.sm,
});

export const close = style({
	appearance: 'none',
	display: 'inline-flex',
	padding: space.lg,
	border: 'none',
	background: 'none',
	cursor: 'pointer',
});
