import { createVar, fallbackVar, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToDevicePx } from '#/styles/round';
import { fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

const HOVER = '&:hover:not(:disabled)';

// `size` variants publish only their font-size through this var; `base` derives the device-snapped line-height
// from it so the snug pairing lives in one place (mirrors the `Text` recipe).
const fontSizeVar = createVar();
const fontSizeScale = fallbackVar(fontSizeVar, fontSize.sm);

export const button = recipe(
	{
		base: {
			alignItems: 'center',
			appearance: 'none',
			border: 'none',
			borderRadius: 999,
			boxSizing: 'border-box',
			color: 'inherit',
			cursor: 'pointer',
			display: 'inline-flex',
			fontFamily: 'inherit',
			fontSize: fontSizeScale,
			fontWeight: fontWeight.medium,
			justifyContent: 'center',
			lineHeight: roundToDevicePx(calc.multiply(fontSizeScale, lineHeight.snug)),
			margin: 0,
			textDecoration: 'none',
			transitionDuration: '100ms',
			transitionProperty: 'background-color, color, border-color',
			transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
			whiteSpace: 'nowrap',
			selectors: {
				// ghost/bare disabled treatment: dim the inherited color. solid colors override this with a
				// muted fill at full opacity (see the per-color compound variants).
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
						// `contrast_0` is white in light themes and dark in dark ones.
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
				// inverted secondary: a high-contrast fill for the active state of toggle-like buttons (e.g.
				// the GIF picker's category pills). `contrast_0` text reads as light-on-dark in light themes
				// and dark-on-light in dark ones.
				color: 'secondary_inverted',
				style: {
					backgroundColor: vars.palette.contrast_900,
					color: vars.palette.contrast_0,
					selectors: {
						[HOVER]: { backgroundColor: vars.palette.contrast_975 },
						'&:disabled': {
							backgroundColor: vars.palette.contrast_600,
							color: vars.palette.contrast_300,
							opacity: 1,
						},
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
			// emitted after the `size` variant, so the square hit target wins over its padding. these exact
			// dimensions matter: a 34px box overflows the 33px header slot, nudging the centered icon off-axis.
			{ shape: 'round', size: 'large', style: { height: 44, padding: 0, width: 44 } },
			{ shape: 'round', size: 'small', style: { height: 33, padding: 0, width: 33 } },
			// `rectangular` squares off the pill (use beside form fields), with tighter padding than the
			// default shape. emitted after `size` so its padding/borderRadius/gap win.
			{
				shape: 'rectangular',
				size: 'large',
				style: { borderRadius: 10, gap: 3, paddingBlock: 12, paddingInline: 25 },
			},
			{
				shape: 'rectangular',
				size: 'small',
				style: { borderRadius: 8, gap: 3, paddingBlock: 8, paddingInline: 13 },
			},
			{
				shape: 'rectangular',
				size: 'tiny',
				style: { borderRadius: 6, gap: 2, paddingBlock: 5, paddingInline: 9 },
			},
		],
		defaultVariants: { color: 'primary', shape: 'default', size: 'small', variant: 'solid' },
		variants: {
			color: { negative: {}, negative_subtle: {}, primary: {}, secondary: {}, secondary_inverted: {} },
			shape: { default: {}, rectangular: {}, round: {} },
			size: {
				large: { gap: 6, paddingBlock: 12, paddingInline: 24, vars: { [fontSizeVar]: fontSize.md } },
				small: { gap: 5, paddingBlock: 8, paddingInline: 14, vars: { [fontSizeVar]: fontSize.sm } },
				tiny: { gap: 3, paddingBlock: 5, paddingInline: 10, vars: { [fontSizeVar]: fontSize.xs } },
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

/**
 * Box wrapping a {@link ButtonIcon}'s icon at a fixed per-size footprint, so icons of different intrinsic
 * sizes occupy the same box and a larger icon never grows the button height.
 */
export const iconBox = recipe(
	{
		base: {
			// grid (not flex) centering: the box is intentionally narrower than some icons (an 18px `md` icon
			// in a 17px small-button box), and a grid item overflows its track centered rather than being
			// shrunk into a non-square smear the way a flex item would.
			// `place-content` (not `place-items`) does the centering: the single auto track grows to fit the
			// icon, so it's the track that overflows the fixed box — `place-content` centers that track,
			// whereas `place-items` only centers the icon within its already-grown track (a no-op here).
			display: 'inline-grid',
			placeContent: 'center',
		},
		compoundVariants: [
			// `2xs` icons keep the full line-height box but a narrower width.
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
			size: {
				large: { height: 20, width: 20 },
				small: { height: 17, width: 17 },
				tiny: { height: 15, width: 15 },
			},
		},
	},
	{ debugId: 'buttonIcon', layer: components },
);
