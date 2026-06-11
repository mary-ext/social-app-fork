import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

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
