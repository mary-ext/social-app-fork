import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const heightVar = createVar();

export const footer = style({
	alignItems: 'center',
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	height: fallbackVar(heightVar, '180px'),
	paddingBottom: space.lg,
	paddingTop: 30,
	width: '100%',
});

export const errorOuter = style({
	boxSizing: 'border-box',
	paddingLeft: space.lg,
	paddingRight: space.lg,
	width: '100%',
});

export const errorRow = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.sm,
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	padding: space.md,
});

export const errorText = style({
	flex: 1,
	minWidth: 0,
});
