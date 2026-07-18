import { createVar, style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

/** Horizontal inset of the scroller and its edge fades; set per-consumer via `gutterWidth`. */
export const gutterVar = createVar();

export const outer = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
});

export const scroller = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	paddingInline: gutterVar,
	width: '100%',
	overflowX: 'auto',
	scrollbarWidth: 'none',
	userSelect: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

const activeColors = {
	borderColor: colors.borderContrastMedium,
	backgroundColor: colors.contrast_25,
	color: colors.text,
};

export const tab = recipe(
	{
		base: {
			appearance: 'none',
			display: 'flex',
			flexShrink: 0,
			// gap only shows through with multiple children (e.g. a label beside a count); single-label pills are unaffected.
			gap: space.sm,
			alignItems: 'center',
			margin: 0,
			border: `1px solid ${colors.borderContrastLow}`,
			borderRadius: borderRadius.full,
			backgroundColor: colors.bg,
			paddingBlock: space.sm,
			paddingInline: space.lg,
			whiteSpace: 'nowrap',
			color: colors.textContrastMedium,
			cursor: 'pointer',
			selectors: {
				'&:focus-visible': {
					outline: `2px solid ${colors.primary_500}`,
					outlineOffset: -2,
				},
				'&:hover, &:active': activeColors,
			},
		},
		defaultVariants: { active: false },
		variants: {
			active: {
				false: {},
				true: activeColors,
			},
		},
	},
	{ debugId: 'tab', layer: components },
);

export const tabLabel = style({
	color: 'inherit',
});

const edgeBase = style({
	display: 'flex',
	position: 'absolute',
	top: 0,
	bottom: 0,
	alignItems: 'center',
});

export const edgeLeft = style([
	edgeBase,
	{
		left: 0,
		justifyContent: 'flex-start',
		background: `linear-gradient(to right, ${colors.bg} 0%, ${colors.bg} 70%, ${colorMix(colors.bg, '0%')} 100%)`,
		paddingRight: space.md,
		paddingLeft: gutterVar,
	},
]);

export const edgeRight = style([
	edgeBase,
	{
		right: 0,
		justifyContent: 'flex-end',
		background: `linear-gradient(to left, ${colors.bg} 0%, ${colors.bg} 70%, ${colorMix(colors.bg, '0%')} 100%)`,
		paddingRight: gutterVar,
		paddingLeft: space.md,
	},
]);

export const edgeButton = style({
	borderColor: colors.borderContrastLow,
});
