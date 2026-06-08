import { type StyleRule, style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '#/styles/contract.css';
import { componentStyle } from '#/styles/layers.css';
import { roundToDevicePx } from '#/styles/round';
import { fontSize } from '#/styles/tokens.css';

const itemReset = {
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	margin: 0,
	padding: 0,
	textAlign: 'left',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
		'&[data-disabled]': { cursor: 'default' },
	},
} satisfies StyleRule;

/** A clickable toggle row that stretches to fill its container (checkbox group member or standalone). */
export const item = componentStyle({ ...itemReset, width: '100%' });

/** A clickable toggle that shares a flex row evenly with its siblings (the radio pair). */
export const radioItem = componentStyle({ ...itemReset, flex: 1 });

/** A vertical stack of panels with the hairline gap that produces the segmented look. */
export const panelGroup = componentStyle({
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	width: '100%',
});

export const panel = componentStyle({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	minHeight: 48,
	paddingBlock: 12,
	paddingInline: 12,
	width: '100%',
	selectors: {
		'[data-checked] &': { backgroundColor: vars.palette.primary_50 },
	},
});

/** Standalone active state for panels not nested in a Base UI toggle (e.g. the lists expander). */
export const panelActive = style({ backgroundColor: vars.palette.primary_50 });

/**
 * Corner rounding by adjacency: a squared edge sits flush against a neighbouring panel, a rounded edge caps
 * the stack.
 */
export const panelAdjacent = styleVariants({
	both: { borderRadius: 4 },
	leading: {
		borderTopLeftRadius: 4,
		borderTopRightRadius: 4,
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
	},
	none: { borderRadius: 12 },
	trailing: {
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		borderBottomLeftRadius: 4,
		borderBottomRightRadius: 4,
	},
});

export const panelTextWithIcon = componentStyle({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: 4,
});

export const panelText = componentStyle({
	color: vars.palette.contrast_700,
	flex: 1,
	fontSize: fontSize.md,
	lineHeight: roundToDevicePx(calc.multiply(fontSize.md, '1.3')),
	selectors: {
		[`[data-checked] &, ${panelActive} &`]: {
			color: vars.palette.contrast_1000,
			fontWeight: 500,
		},
	},
});

export const panelIcon = componentStyle({
	alignItems: 'center',
	color: vars.palette.contrast_700,
	display: 'flex',
	flexShrink: 0,
	selectors: {
		[`[data-checked] &, ${panelActive} &`]: { color: vars.palette.contrast_1000 },
	},
});

// #region indicators
export const circle = componentStyle({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	width: 24,
	selectors: {
		'[data-checked] &': {
			backgroundColor: vars.palette.primary_500,
			borderColor: vars.palette.primary_500,
		},
	},
});

export const dot = componentStyle({
	backgroundColor: vars.palette.white,
	borderRadius: 999,
	height: 12,
	width: 12,
});

export const box = componentStyle({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 6,
	boxSizing: 'border-box',
	color: vars.palette.white,
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	width: 24,
	selectors: {
		'[data-checked] &': {
			backgroundColor: vars.palette.primary_500,
			borderColor: vars.palette.primary_500,
		},
	},
});

export const check = componentStyle({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
});

export const switchTrack = componentStyle({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_200,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	height: 28,
	padding: 3,
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	width: 48,
	selectors: {
		'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
	},
});

export const switchThumb = componentStyle({
	backgroundColor: vars.palette.white,
	borderRadius: 999,
	height: 22,
	transitionDuration: '100ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
	width: 22,
	selectors: {
		'[data-checked] &': { transform: 'translateX(20px)' },
	},
});
// #endregion
