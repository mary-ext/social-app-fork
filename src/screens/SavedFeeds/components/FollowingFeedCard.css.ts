import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	minHeight: 40,
});

export const icon = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	marginRight: space.md,
	borderRadius: borderRadius.sm,
	backgroundColor: colors.primary_500,
	width: 36,
	height: 36,
});
