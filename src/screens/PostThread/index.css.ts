import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

import { colors } from '#/styles/colors';
import { zIndex } from '#/styles/tokens.css';

export const footer = style({
	boxSizing: 'border-box',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
});

export const footerNoBorder = style({
	borderTopWidth: 0,
});

export const mobileComposePrompt = style({
	position: 'fixed',
	right: 0,
	bottom: fallbackVar(bottomBarHeightVar, '0px'),
	left: 0,
	zIndex: zIndex.raised,
});
