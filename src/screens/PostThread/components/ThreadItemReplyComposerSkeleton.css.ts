import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const outer = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	paddingBottom: space.xs,
	paddingLeft: space.sm,
	paddingRight: space.sm,
	paddingTop: space.xs,
});

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
