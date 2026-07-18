import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const outer = style({
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	paddingTop: space.xs,
	paddingRight: space.sm,
	paddingBottom: space.xs,
	paddingLeft: space.sm,
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space.sm,
	paddingRight: space.sm,
	paddingBottom: space.sm,
	paddingLeft: space.sm,
});
