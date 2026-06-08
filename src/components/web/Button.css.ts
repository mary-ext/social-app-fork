import { styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToDevicePx } from '#/styles/round';
import { fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

const HOVER = '&:hover:not(:disabled)';

export const button = recipe(
	{
		base: {
			alignItems: 'center',
			appearance: 'none',
			border: 'none',
			borderRadius: 999,
			color: 'inherit',
			cursor: 'pointer',
			display: 'inline-flex',
			fontFamily: 'inherit',
			fontWeight: fontWeight.medium,
			justifyContent: 'center',
			margin: 0,
			textDecoration: 'none',
			transitionDuration: '100ms',
			transitionProperty: 'background-color, color, border-color',
			transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
			whiteSpace: 'nowrap',
			selectors: {
				// ghost/bare disabled treatment: dim the inherited color. solid colors override this with a
				// muted fill at full opacity (see the per-color compound variants), matching upstream.
				'&:disabled': { cursor: 'default', opacity: 0.5 },
				'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			},
		},
		compoundVariants: [
			{
				color: 'negative',
				style: {
					backgroundColor: vars.palette.negative_500,
					color: vars.palette.white,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.negative_600 },
						'&:disabled': {
							backgroundColor: vars.palette.negative_700,
							color: vars.palette.negative_300,
							opacity: 1,
						},
					},
				},
				variant: 'solid',
			},
			{
				color: 'primary',
				style: {
					backgroundColor: vars.palette.primary_500,
					color: vars.palette.white,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.primary_600 },
						// `contrast_0` is white in light themes and dark in dark ones — upstream's white/text_inverted split.
						'&:disabled': {
							backgroundColor: vars.palette.primary_200,
							color: vars.palette.contrast_0,
							opacity: 1,
						},
					},
				},
				variant: 'solid',
			},
			{
				color: 'secondary',
				style: {
					backgroundColor: vars.palette.contrast_50,
					color: vars.palette.contrast_700,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.contrast_100 },
						'&:disabled': { color: vars.palette.contrast_300, opacity: 1 },
					},
				},
				variant: 'solid',
			},
			{
				// subtle destructive action (e.g. the composer's "Discard"): tinted fill rather than a
				// full-strength negative button.
				color: 'negative_subtle',
				style: {
					backgroundColor: vars.palette.negative_50,
					color: vars.palette.negative_600,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.negative_100 },
						'&:disabled': { color: vars.palette.negative_200, opacity: 1 },
					},
				},
				variant: 'solid',
			},
			{
				color: 'negative',
				style: {
					backgroundColor: 'transparent',
					color: vars.palette.negative_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.negative_100 } },
				},
				variant: 'ghost',
			},
			{
				color: 'primary',
				style: {
					backgroundColor: 'transparent',
					color: vars.palette.primary_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.primary_100 } },
				},
				variant: 'ghost',
			},
			{
				color: 'secondary',
				style: {
					backgroundColor: 'transparent',
					color: vars.palette.contrast_600,
					selectors: { [HOVER]: { backgroundColor: vars.palette.contrast_50 } },
				},
				variant: 'ghost',
			},
			// emitted after the `size` variant, so the square hit target wins over its padding.
			{ shape: 'round', style: { height: 34, padding: 0, width: 34 } },
		],
		defaultVariants: { color: 'primary', shape: 'default', size: 'small', variant: 'solid' },
		variants: {
			color: { negative: {}, negative_subtle: {}, primary: {}, secondary: {} },
			shape: { default: {}, round: {} },
			size: {
				large: {
					fontSize: fontSize.md,
					gap: 6,
					lineHeight: roundToDevicePx(calc.multiply(fontSize.md, lineHeight.snug)),
					paddingBlock: 12,
					paddingInline: 24,
				},
				small: {
					fontSize: fontSize.sm,
					gap: 5,
					lineHeight: roundToDevicePx(calc.multiply(fontSize.sm, lineHeight.snug)),
					paddingBlock: 8,
					paddingInline: 14,
				},
			},
			// `bare` inherits its surroundings (e.g. a full-row pressable); solid/ghost colors come from the
			// compound variants above.
			variant: { bare: { backgroundColor: 'transparent', color: 'inherit' }, ghost: {}, solid: {} },
		},
	},
	{ debugId: 'button', layer: components },
);

/** Per-instance font-size override for {@link ButtonText}, keyed by the {@link fontSize} scale. */
export const textSize = styleVariants(fontSize, (value) => ({
	'@layer': { [components]: { fontSize: value } },
}));

/** Box wrapping a {@link ButtonIcon}'s icon, normalizing its footprint to match the RNW Button. */
export const iconBox = recipe(
	{
		base: {
			alignItems: 'center',
			display: 'inline-flex',
			justifyContent: 'center',
		},
		compoundVariants: [
			// `2xs` icons keep the full line-height box but a narrower width, matching upstream.
			{ narrow: true, size: 'large', style: { width: 10 } },
			{ narrow: true, size: 'small', style: { width: 10 } },
		],
		variants: {
			narrow: { false: {}, true: {} },
			// the icon hugs the button edge tighter than the text does: the flex gap is deliberately a
			// touch wide and each icon is pulled back in with a negative margin. round icon-only buttons
			// center a lone icon, so they skip the pull.
			pull: { false: {}, true: { marginInline: -2 } },
			// box edge length per button size, matching the rendered text line so a larger icon never
			// grows the button height (`2xs` narrows the width via the compound variants above).
			size: { large: { height: 20, width: 20 }, small: { height: 17, width: 17 } },
		},
	},
	{ debugId: 'buttonIcon', layer: components },
);
