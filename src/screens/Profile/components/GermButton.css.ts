import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

// backs both the `GermLink` anchor and the `GermSelfButton` trigger `<button>`, so it resets the native
// button chrome (appearance/border/font) alongside the shared pill styling.
export const pill = style({
	alignItems: 'center',
	alignSelf: 'flex-start',
	appearance: 'none',
	backgroundColor: colors.contrast_50,
	border: 'none',
	borderRadius: borderRadius.full,
	color: colors.text,
	cursor: 'pointer',
	display: 'inline-flex',
	flexDirection: 'row',
	font: 'inherit',
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
	marginInline: space._2xs,
});
