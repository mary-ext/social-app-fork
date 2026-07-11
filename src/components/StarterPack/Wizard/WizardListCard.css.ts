import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const row = style({
	alignItems: 'center',
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	paddingBlock: space.md,
	paddingInline: space.lg,
	width: '100%',
});

export const textCol = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});
