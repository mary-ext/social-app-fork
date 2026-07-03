import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

/** Top-bordered container for the desktop reply-composer loading placeholder. */
export const outer = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	paddingBottom: space.xs,
	paddingLeft: space.sm,
	paddingRight: space.sm,
	paddingTop: space.xs,
});

/** Avatar + display-name placeholder row. */
export const row = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	paddingBottom: space.sm,
	paddingLeft: space.sm,
	paddingRight: space.sm,
	paddingTop: space.sm,
});
