import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, fontWeight, space } from '#/styles/tokens.css';

export const group = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	alignItems: 'flex-start',
});

export const item = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
	alignSelf: 'flex-start',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	margin: 0,
	border: 'none',
	borderRadius: borderRadius.sm,
	background: 'transparent',
	paddingBlock: 6,
	paddingInline: space.sm,
	textAlign: 'left',
	textDecoration: 'none',
	color: colors.textContrastMedium,
	cursor: 'pointer',
	selectors: {
		'&:hover': { color: colors.text },
		'&[data-pressed]': {
			backgroundColor: colors.primary_50,
			color: colors.text,
			fontWeight: fontWeight.semiBold,
		},
		'&:focus-visible': { outline: `2px solid ${colors.primary_500}`, outlineOffset: 2 },
	},
});

export const label = style({
	color: 'inherit',
});

const badge = {
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: borderRadius.xs,
	width: 20,
	height: 20,
} as const;

export const followingIcon = style({
	...badge,
	backgroundColor: colors.primary_500,
});

export const avatar = style({
	flexShrink: 0,
});

export const morePlusBox = style({
	...badge,
	backgroundColor: colors.contrast_50,
	selectors: {
		[`${item}[data-pressed] &`]: { backgroundColor: colors.primary_100 },
	},
});

export const skeleton = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
});

export const skeletonRow = style({
	paddingBlock: 6,
	paddingInline: space.sm,
});
