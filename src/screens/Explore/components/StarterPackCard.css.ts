import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.sm,
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	overflow: 'hidden',
	padding: space.lg,
	position: 'relative',
	textDecoration: 'none',
	width: '100%',
	':hover': {
		backgroundColor: colors.contrast_25,
	},
});

export const stackWidthVar = createVar();

export const stack = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	isolation: 'isolate',
	position: 'relative',
	width: stackWidthVar,
});

export const cellWidthVar = createVar();
export const cellZVar = createVar();

export const cell = style({
	position: 'relative',
	width: cellWidthVar,
	zIndex: cellZVar,
});

export const cellInner = style({
	position: 'relative',
	width: '120%',
});

export const circle = style({
	aspectRatio: '1',
	backgroundColor: colors.contrast_25,
	borderRadius: borderRadius.full,
	position: 'relative',
	width: '100%',
});

export const avatarFill = style({
	inset: 0,
	position: 'absolute',
});

export const placeholderBorder = style({
	borderRadius: borderRadius.full,
	boxShadow: `inset 0 0 0 1px ${colors.borderContrastLow}`,
	inset: 0,
	position: 'absolute',
});

export const totalBox = style({
	aspectRatio: '1',
	position: 'relative',
	width: '100%',
});

export const totalInner = style({
	alignItems: 'center',
	backgroundColor: colors.textContrastLow,
	borderRadius: borderRadius.full,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});

export const totalText = style({
	color: 'white',
});

export const body = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	width: '100%',
});

export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const openPackPlaceholder = style({
	backgroundColor: colors.contrast_50,
	borderRadius: borderRadius.sm,
	flexShrink: 0,
	height: 33,
	width: 100,
});
