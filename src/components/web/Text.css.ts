import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { recipe } from '#/components/web/css/recipe';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { roundToDevicePx } from '#/styles/round';
import { fontFamily, fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

/** Turns a token scale into a variant group setting `property` to each token value. */
const variantsFor = <Scale extends Record<string, number | string>, Property extends string>(
	scale: Scale,
	property: Property,
): { [Key in keyof Scale]: Record<Property, Scale[Key]> } => {
	const out: Record<string, Record<Property, number | string>> = {};
	for (const [key, value] of Object.entries(scale)) {
		out[key] = { [property]: value } as Record<Property, number | string>;
	}
	return out as { [Key in keyof Scale]: Record<Property, Scale[Key]> };
};

// the line-height ratio is published as a var so the `size` variant can fold it into the device-snapped
// line-height calc (leading and size are independent variants applied to the same element)
const leadingVar = createVar();

/** A `leading` variant group publishing each ratio onto {@link leadingVar} for the `size` calc to consume. */
const leadingVariants = <Scale extends Record<string, number>>(
	scale: Scale,
): { [Key in keyof Scale]: { vars: Record<string, string> } } => {
	const out: Record<string, { vars: Record<string, string> }> = {};
	for (const [key, ratio] of Object.entries(scale)) {
		out[key] = { vars: { [leadingVar]: String(ratio) } };
	}
	return out as { [Key in keyof Scale]: { vars: Record<string, string> } };
};

/**
 * A `size` variant group setting `font-size` and a `line-height` snapped to the device-pixel grid —
 * `round(fontSize * leading, 1px / dpr)` — so it lands on whole device pixels like RNW rather than leaving a
 * fractional CSS value.
 */
const sizeVariants = <Scale extends Record<string, string>>(
	scale: Scale,
): { [Key in keyof Scale]: { fontSize: string; lineHeight: string } } => {
	const out: Record<string, { fontSize: string; lineHeight: string }> = {};
	for (const [key, size] of Object.entries(scale)) {
		out[key] = {
			fontSize: size,
			lineHeight: roundToDevicePx(calc.multiply(size, fallbackVar(leadingVar, '1.3'))),
		};
	}
	return out as { [Key in keyof Scale]: { fontSize: string; lineHeight: string } };
};

export const text = recipe(
	{
		base: { fontFamily, margin: 0, padding: 0 },
		defaultVariants: { color: 'text', leading: 'snug', size: 'sm' },
		variants: {
			align: { center: { textAlign: 'center' }, left: { textAlign: 'left' }, right: { textAlign: 'right' } },
			color: variantsFor(colors, 'color'),
			leading: leadingVariants(lineHeight),
			size: sizeVariants(fontSize),
			weight: variantsFor(fontWeight, 'fontWeight'),
		},
	},
	{ debugId: 'text', layer: components },
);

/** Set per-instance via `assignInlineVars` — the only value that can't be known at build time. */
export const lineClampVar = createVar();

export const clamp = style({
	'@layer': {
		[components]: {
			display: '-webkit-box',
			overflow: 'hidden',
			WebkitBoxOrient: 'vertical',
			WebkitLineClamp: lineClampVar,
		},
	},
});

export const userSelect = styleVariants({
	none: { '@layer': { [components]: { userSelect: 'none' } } },
	text: { '@layer': { [components]: { userSelect: 'text' } } },
});
