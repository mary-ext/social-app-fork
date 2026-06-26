import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const emptyContainer = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	justifyContent: 'center',
});

export const endOfFeed = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	paddingBlock: space._5xl,
	width: '100%',
});
