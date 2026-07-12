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
	flexDirection: 'row',
	position: 'relative',
});

export const scroller = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	overflowX: 'auto',
	paddingInline: gutterVar,
	userSelect: 'none',
	width: '100%',
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

const activeColors = {
	backgroundColor: colors.contrast_25,
	borderColor: colors.borderContrastMedium,
	color: colors.text,
};

export const tab = recipe(
	{
		base: {
			alignItems: 'center',
			appearance: 'none',
			backgroundColor: colors.bg,
			border: `1px solid ${colors.borderContrastLow}`,
			borderRadius: borderRadius.full,
			color: colors.textContrastMedium,
			cursor: 'pointer',
			display: 'flex',
			flexShrink: 0,
			// gap only shows through with multiple children (e.g. a label beside a count); single-label pills are unaffected.
			gap: space.sm,
			margin: 0,
			paddingBlock: space.sm,
			paddingInline: space.lg,
			whiteSpace: 'nowrap',
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
	alignItems: 'center',
	bottom: 0,
	display: 'flex',
	position: 'absolute',
	top: 0,
});

export const edgeLeft = style([
	edgeBase,
	{
		background: `linear-gradient(to right, ${colors.bg} 0%, ${colors.bg} 70%, ${colorMix(colors.bg, '0%')} 100%)`,
		justifyContent: 'flex-start',
		left: 0,
		paddingLeft: gutterVar,
		paddingRight: space.md,
	},
]);

export const edgeRight = style([
	edgeBase,
	{
		background: `linear-gradient(to left, ${colors.bg} 0%, ${colors.bg} 70%, ${colorMix(colors.bg, '0%')} 100%)`,
		justifyContent: 'flex-end',
		paddingLeft: space.md,
		paddingRight: gutterVar,
		right: 0,
	},
]);

export const edgeButton = style({
	borderColor: colors.borderContrastLow,
});
