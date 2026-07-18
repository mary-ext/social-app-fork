import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const pill = style({
	appearance: 'none',
	display: 'inline-flex',
	flexDirection: 'row',
	alignItems: 'center',
	alignSelf: 'flex-start',
	border: 'none',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_50,
	padding: 6,
	textDecoration: 'none',
	color: colors.text,
	font: 'inherit',
	cursor: 'pointer',
});

export const logo = style({
	display: 'block',
	borderRadius: borderRadius.full,
	objectFit: 'cover',
});

export const label = style({
	marginLeft: space.xs,
});

export const arrow = style({
	marginInline: space._2xs,
});
