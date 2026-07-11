import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { vars } from '#/styles/contract.css';

export const activeMargin = style({
	marginTop: 8,
});

export const recordCardGap = style({
	marginTop: 8,
});

export const standardSiteGap = style({
	marginTop: 8,
});

export const externalCardGap = style({
	marginTop: 8,
});

export const postWithMedia = style({
	display: 'flex',
	flexDirection: 'column',
});

export const quoteOuter = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
});

export const quoteOuterGap = style({
	marginTop: 8,
});

export const quoteBody = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	selectors: {
		'&:focus-visible': { outline: 'none' },
	},
});

export const quotePad = style({
	padding: 12,
});

export const quoteBodyDisabled = style({
	pointerEvents: 'none',
});

export const postAlerts = style({
	paddingBlock: 4,
});

export const quoteMetaPad = style({
	paddingBottom: 4,
});

export const quoteCard = style({
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
	selectors: {
		'&:has(> [role="link"]:focus-visible)': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const quoteCardHover = style({
	cursor: 'pointer',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(vars.palette.contrast_50, vars.opacity.hover),
		},
	},
});

export const quoteActive = style({
	padding: 12,
});

export const quoteRevealed = style({
	paddingTop: 8,
});
