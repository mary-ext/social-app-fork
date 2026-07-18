import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

import { colors } from '#/styles/colors';
import { zIndex } from '#/styles/tokens.css';

export const footer = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	boxSizing: 'border-box',
});

export const footerNoBorder = style({
	borderTopWidth: 0,
});

export const mobileComposePrompt = style({
	bottom: fallbackVar(bottomBarHeightVar, '0px'),
	left: 0,
	position: 'fixed',
	right: 0,
	zIndex: zIndex.raised,
});
