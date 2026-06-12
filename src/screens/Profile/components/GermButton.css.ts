import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const pill = style({
	alignItems: 'center',
	alignSelf: 'flex-start',
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.full,
	color: colors.text,
	cursor: 'pointer',
	display: 'inline-flex',
	flexDirection: 'row',
	padding: 6,
	textDecoration: 'none',
});

export const logo = style({
	borderRadius: borderRadius.full,
	display: 'block',
	objectFit: 'cover',
});

export const label = style({
	marginLeft: space.xs,
});

export const arrow = style({
	color: colors.text,
	display: 'inline-flex',
	marginInline: space._2xs,
});
