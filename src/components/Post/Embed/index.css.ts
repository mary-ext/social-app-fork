import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const activeMargin = style({
	marginTop: 8,
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

// extra padding once the quote is revealed; the inner content drops its own padding while active.
export const quoteActive = style({
	padding: 12,
	paddingTop: 8,
});

// the revealed quote body.
export const quoteRevealed = style({
	paddingTop: 8,
});
