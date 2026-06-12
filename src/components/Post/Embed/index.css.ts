import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { vars } from '#/styles/contract.css';

export const activeMargin = style({
	marginTop: 8,
});

// QuoteEmbed bleed host: GalleryBleed measures this and clips the image-carousel bleed to it.
export const quoteOuter = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	marginTop: 8,
});

// the quote card body that stacks meta/text/embed; padding drops while the card is revealed.
export const quoteBody = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
});

export const quotePad = style({
	padding: 12,
});

export const postAlerts = style({
	paddingBlock: 4,
});

// ModeratedFeedEmbed / ModeratedListEmbed: lift the revealed card off the blur toggle.
export const revealedPadXs = style({
	paddingTop: 4,
});

// QuoteEmbed card chrome — always applied; carries the border + radius.
export const quoteCard = style({
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 12,
});

// Hover tint for a clickable quote card; sits behind content (clipped to the radius) so the quoted text
// isn't darkened the way an overlay would.
export const quoteCardHover = style({
	cursor: 'pointer',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(vars.palette.contrast_50, vars.opacity.hover),
		},
	},
});

// extra padding once the quote is revealed; the inner content drops its own padding while active.
export const quoteActive = style({
	padding: 12,
	paddingTop: 8,
});

// the revealed quote body.
export const quoteRevealed = style({
	paddingTop: 8,
});
