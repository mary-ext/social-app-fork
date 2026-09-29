import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { zIndex } from '#/styles/tokens.css';

export const footer = style({
	boxSizing: 'border-box',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	height: 180,
});

// leave room to scroll the anchor post to the top when it has parents
export const footerTall = style({
	height: 'calc(100svh - 200px)',
});

export const footerNoBorder = style({
	borderTopWidth: 0,
});

export const mobileComposePrompt = style({
	position: 'fixed',
	right: 0,
	bottom: 0,
	left: 0,
	zIndex: zIndex.raised,
});
