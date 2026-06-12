import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
});

export const icon = style({
	color: colors.textContrastMedium,
	display: 'flex',
	justifyContent: 'center',
	paddingBottom: space.md,
});

export const text = style({
	alignSelf: 'center',
	maxWidth: 300,
	paddingBottom: space.xl,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	width: '100%',
});
