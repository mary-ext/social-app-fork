import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, fontWeight, space } from '#/styles/tokens.css';

export const group = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
});

export const item = style({
	alignItems: 'center',
	alignSelf: 'flex-start',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: borderRadius.sm,
	boxSizing: 'border-box',
	color: colors.textContrastMedium,
	cursor: 'pointer',
	display: 'flex',
	gap: space.sm,
	margin: 0,
	paddingBlock: 6,
	paddingInline: space.sm,
	textAlign: 'left',
	textDecoration: 'none',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
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
	alignItems: 'center',
	borderRadius: borderRadius.xs,
	display: 'flex',
	flexShrink: 0,
	height: 20,
	justifyContent: 'center',
	width: 20,
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
