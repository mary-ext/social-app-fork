import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { withAlpha } from '#/styles/functions';
import { hover } from '#/styles/interaction';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

/** horizontal inset set by `Root`'s `gutterWidth`, in pixels. */
export const gutterVar = createVar();

export const outer = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	minWidth: 0,
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
	borderColor: vars.palette.primary_500,
	backgroundColor: vars.palette.primary_500,
	color: vars.palette.white,
};

export const tab = recipe(
	{
		base: {
			appearance: 'none',
			boxSizing: 'border-box',
			display: 'flex',
			flexShrink: 0,
			gap: space.sm,
			alignItems: 'center',
			margin: 0,
			border: `1px solid ${colors.borderContrastMedium}`,
			borderRadius: borderRadius.full,
			backgroundColor: colors.bg,
			paddingBlock: 0,
			paddingInline: space.lg,
			height: 33,
			whiteSpace: 'nowrap',
			color: colors.textContrastMedium,
			cursor: 'pointer',
			selectors: {
				'&:focus-visible': {
					outline: `2px solid ${colors.primary_500}`,
					outlineOffset: -2,
				},
				[hover(':not(:disabled):not([data-active])')]: { backgroundColor: colors.contrast_50 },
				'&:disabled': { cursor: 'default', opacity: 0.5 },
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

export const edge = style({
	display: 'flex',
	position: 'absolute',
	top: 0,
	bottom: 0,
	// keep fades above pills that create stacking contexts
	zIndex: 1,
	alignItems: 'center',
	opacity: 0,
	// keep pills beneath the fade clickable
	pointerEvents: 'none',
	transition: 'opacity 150ms ease-out',
	selectors: {
		'&[data-visible]': { opacity: 1 },
		'&[data-side="left"]': {
			left: 0,
			justifyContent: 'flex-start',
			background: `linear-gradient(to right, ${colors.bg} 0%, ${colors.bg} 70%, ${withAlpha(colors.bg, '0%')} 100%)`,
			paddingRight: space.md,
			paddingLeft: gutterVar,
		},
		'&[data-side="right"]': {
			right: 0,
			justifyContent: 'flex-end',
			background: `linear-gradient(to left, ${colors.bg} 0%, ${colors.bg} 70%, ${withAlpha(colors.bg, '0%')} 100%)`,
			paddingRight: gutterVar,
			paddingLeft: space.md,
		},
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
});

export const arrow = style({
	borderColor: colors.borderContrastLow,
	selectors: {
		[`${edge}[data-visible] &`]: { pointerEvents: 'auto' },
	},
});
