import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToDevicePx } from '#/styles/round';
import { fontSize, lineHeight, zIndex } from '#/styles/tokens.css';

export const backdrop = style(
	layered(components, {
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		inset: 0,
		position: 'fixed',
		transitionDuration: '150ms',
		transitionProperty: 'opacity',
		zIndex: zIndex.dialog,
		selectors: {
			'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
		},
	}),
);

// vertically centered with symmetric padding (vs the content Dialog's top-anchored 10vh viewport): a
// confirmation prompt reads as a focal interruption, so it sits in the middle of the screen.
export const viewport = style(
	layered(components, {
		alignItems: 'center',
		bottom: 0,
		boxSizing: 'border-box',
		display: 'flex',
		justifyContent: 'center',
		left: 0,
		overflowY: 'auto',
		padding: 16,
		position: 'fixed',
		right: 0,
		top: 0,
		zIndex: zIndex.dialog,
	}),
);

export const popup = recipe(
	{
		base: {
			backgroundColor: vars.palette.contrast_0,
			border: `1px solid ${vars.palette.contrast_200}`,
			borderRadius: 20,
			boxShadow: vars.shadow.lg,
			boxSizing: 'border-box',
			padding: 24,
			position: 'relative',
			transitionDuration: '200ms',
			transitionProperty: 'opacity, transform',
			transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
			width: '100%',
			selectors: {
				'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
			},
		},
		variants: {
			// `wide` gives the icon-row explainer enough room to keep each row to one or two lines.
			size: {
				default: { maxWidth: 320 },
				wide: { maxWidth: 420 },
			},
		},
		defaultVariants: { size: 'default' },
	},
	{ debugId: 'promptPopup', layer: components },
);

export const title = style({
	color: vars.palette.contrast_1000,
	fontSize: fontSize._2xl,
	fontWeight: 600,
	lineHeight: roundToDevicePx(calc.multiply(fontSize._2xl, lineHeight.snug)),
	margin: 0,
	paddingBottom: 4,
});

export const description = style({
	color: vars.palette.contrast_900,
	fontSize: fontSize.md,
	lineHeight: roundToDevicePx(calc.multiply(fontSize.md, lineHeight.snug)),
	margin: 0,
	paddingBottom: 16,
});

export const content = style({
	paddingBottom: 8,
});

export const rows = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 14,
	paddingBottom: 16,
});

export const row = style({
	alignItems: 'flex-start',
	display: 'flex',
	gap: 12,
});

export const rowIcon = style({
	color: vars.palette.contrast_500,
	flexShrink: 0,
	lineHeight: 0,
});

export const rowText = style({
	color: vars.palette.contrast_900,
	fontSize: fontSize.md,
	lineHeight: roundToDevicePx(calc.multiply(fontSize.md, lineHeight.snug)),
	paddingBlock: 1,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
	width: '100%',
});
