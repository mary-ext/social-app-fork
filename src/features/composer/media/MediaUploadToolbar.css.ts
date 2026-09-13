import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const toolbar = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const doneIcon = style({
	width: 20,
	height: 20,
	color: colors.primary_500,
});
