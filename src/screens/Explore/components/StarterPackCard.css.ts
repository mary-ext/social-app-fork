import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	gap: space.md,
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.sm,
	padding: space.lg,
	width: '100%',
	overflow: 'hidden',
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
	':hover': {
		backgroundColor: colors.contrast_25,
	},
});

export const stackWidthVar = createVar();

export const stack = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	alignItems: 'center',
	isolation: 'isolate',
	width: stackWidthVar,
});

export const cellWidthVar = createVar();
export const cellZVar = createVar();

export const cell = style({
	position: 'relative',
	zIndex: cellZVar,
	width: cellWidthVar,
});

export const cellInner = style({
	position: 'relative',
	width: '120%',
});

export const circle = style({
	position: 'relative',
	borderRadius: borderRadius.full,
	backgroundColor: colors.contrast_25,
	aspectRatio: '1',
	width: '100%',
});

export const avatarFill = style({
	position: 'absolute',
	inset: 0,
});

export const placeholderBorder = style({
	position: 'absolute',
	inset: 0,
	borderRadius: borderRadius.full,
	boxShadow: `inset 0 0 0 1px ${colors.borderContrastLow}`,
});

export const totalBox = style({
	position: 'relative',
	aspectRatio: '1',
	width: '100%',
});

export const totalInner = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.full,
	backgroundColor: colors.textContrastLow,
});

export const totalText = style({
	color: 'white',
});

export const body = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.lg,
	alignItems: 'center',
	width: '100%',
});

export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const openPackPlaceholder = style({
	flexShrink: 0,
	borderRadius: borderRadius.sm,
	backgroundColor: colors.contrast_50,
	width: 100,
	height: 33,
});
