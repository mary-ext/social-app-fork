import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

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
	selectors: {
		[hover()]: {
			backgroundColor: colors.contrast_25,
		},
	},
});

export const countVar = createVar();

// 120%-wide items overlap; the final 0.2fr track contains the last item's overhang
export const stack = style({
	display: 'grid',
	gridTemplateColumns: `repeat(${countVar}, minmax(0, 1fr)) minmax(0, 0.2fr)`,
	alignItems: 'center',
	isolation: 'isolate',
});

export const zVar = createVar();

const item = style({
	position: 'relative',
	gridRow: 1,
	zIndex: zVar,
	borderRadius: borderRadius.full,
	width: '120%',
	aspectRatio: '1',
});

export const circle = style([
	item,
	{
		backgroundColor: colors.contrast_25,
	},
]);

export const avatar = style({
	width: '100%',
	height: '100%',
});

export const placeholderBorder = style({
	position: 'absolute',
	inset: 0,
	borderRadius: borderRadius.full,
	boxShadow: `inset 0 0 0 1px ${colors.borderContrastLow}`,
});

export const total = style([
	item,
	{
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.textContrastLow,
	},
]);

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

export const plusIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: '#fff',
});
