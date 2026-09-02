import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize } from '#/styles/tokens.css';

export const richText = style({
	display: 'flex',
	flexDirection: 'column',
});

export const showMoreRow = style({
	alignSelf: 'flex-start',
	fontSize: fontSize.md,
});

export const showMore = style({
	border: 'none',
	background: 'none',
	padding: 0,
	paddingBottom: 5,
	textDecoration: 'none',
	lineHeight: roundToPx(`calc(${fontSize.md} * ${fontLeading.md})`),
	color: vars.text.link,
	fontFamily: 'inherit',
	fontSize: fontSize.md,
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': { outline: 'none', textDecoration: 'underline' },
		[hover()]: { textDecoration: 'underline' },
	},
});
