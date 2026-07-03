import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

export const richText = style({
	display: 'flex',
	flexDirection: 'column',
});

// the clamped-text reveal toggle. styled to match <InlineLinkText size="md" underline="hover"> — md text in
// the primary color that underlines on hover/focus — over a reset <button>.
export const showMore = style({
	alignSelf: 'flex-start',
	background: 'none',
	border: 'none',
	color: vars.palette.primary_500,
	cursor: 'pointer',
	fontFamily: 'inherit',
	fontSize: fontSize.md,
	lineHeight: roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`),
	padding: 0,
	paddingBottom: 5,
	textDecoration: 'none',
	selectors: {
		'&:focus-visible': { outline: 'none', textDecoration: 'underline' },
		'&:hover': { textDecoration: 'underline' },
	},
});
