import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

export const richText = style({
	display: 'flex',
	flexDirection: 'column',
});

export const showMore = style({
	alignSelf: 'flex-start',
	border: 'none',
	background: 'none',
	padding: 0,
	paddingBottom: 5,
	textDecoration: 'none',
	lineHeight: roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`),
	color: vars.palette.primary_500,
	fontFamily: 'inherit',
	fontSize: fontSize.md,
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': { outline: 'none', textDecoration: 'underline' },
		'&:hover': { textDecoration: 'underline' },
	},
});
