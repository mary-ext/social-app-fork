import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/web/Shell/Shell.css';

import { colors } from '#/styles/colors';
import { zIndex } from '#/styles/tokens.css';

/** Trailing spacer that reserves scroll room to pin the anchor post to the top. */
export const footer = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	boxSizing: 'border-box',
});

/** Drops the divider for the tombstone (blocked / not-found) view. */
export const footerNoBorder = style({
	borderTopWidth: 0,
});

/** Fixed mobile reply prompt, sitting just above the in-flow bottom bar (height published by the shell). */
export const mobileComposePrompt = style({
	bottom: fallbackVar(bottomBarHeightVar, '0px'),
	left: 0,
	position: 'fixed',
	right: 0,
	zIndex: zIndex.sticky,
});
