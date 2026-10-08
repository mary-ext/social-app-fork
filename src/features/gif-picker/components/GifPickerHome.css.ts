import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	paddingBottom: space.sm,
});

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const sectionHeader = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
});

export const seeAll = style({
	marginBlock: -space.xs,
	marginRight: -space.sm,
});

export const recents = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
	gap: space.sm,
});

export const categories = style({
	display: 'grid',
	// thirds are too narrow for the labels on phones.
	gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
	gap: space.sm,
	'@media': {
		'(width >= 800px)': {
			gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		},
	},
});

export const category = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
	margin: 0,
	border: 'none',
	borderRadius: borderRadius.md,
	backgroundColor: colors.contrast_50,
	paddingInline: space.md,
	minWidth: 0,
	height: 44,
	color: colors.textContrastHigh,
	textAlign: 'start',
	cursor: 'pointer',
	selectors: {
		[hover()]: { backgroundColor: colors.contrast_100 },
		'&:focus-visible': { outline: `2px solid ${colors.primary_500}`, outlineOffset: 2 },
	},
});

export const categoryIcon = style({
	flexShrink: 0,
	width: iconSize.lg,
	height: iconSize.lg,
});

export const categoryLabel = style({
	minWidth: 0,
});
