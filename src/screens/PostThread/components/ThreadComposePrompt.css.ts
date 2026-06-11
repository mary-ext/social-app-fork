import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

/** `position: relative` anchors the mobile fade gradient (absolute inset-0). */
export const outer = style({
	boxSizing: 'border-box',
	paddingLeft: space.sm,
	paddingRight: space.sm,
	position: 'relative',
});

export const outerDesktop = style({
	backgroundColor: colors.bg,
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	paddingBottom: space.xs,
	paddingTop: space.xs,
});

export const outerMobile = style({
	paddingBottom: space._2xs,
});
