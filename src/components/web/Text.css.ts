import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
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

/** Turns a token scale into a variant group assigning each token value to `cssVar`. */
const varVariantsFor = <Scale extends Record<string, number | string>>(
	scale: Scale,
	cssVar: string,
): { [Key in keyof Scale]: { vars: Record<string, string> } } => {
	const out: Record<string, { vars: Record<string, string> }> = {};
	for (const [key, value] of Object.entries(scale)) {
		out[key] = { vars: { [cssVar]: String(value) } };
	}
	return out as { [Key in keyof Scale]: { vars: Record<string, string> } };
};

// font-size and the line-height ratio are published as vars so the `size`/`leading` variants only assign
// them and `base` derives the actual `font-size` and device-snapped `line-height` from both (they're
// independent variants applied to the same element). `fontSizeVar` is exported so another recipe can resize
// the text by overriding it alone, letting both derived properties follow.
export const fontSizeVar = createVar();
export const leadingVar = createVar();

const fontSizeScale = fallbackVar(fontSizeVar, fontSize.sm);

export const text = recipe(
	{
		base: {
			fontFamily,
			fontSize: fontSizeScale,
			// snap the derived line-height to the device-pixel grid — `round(fontSize * leading, 1px / dpr)` — so
			// it lands on whole device pixels like RNW rather than a fractional CSS value
			lineHeight: roundToDevicePx(calc.multiply(fontSizeScale, fallbackVar(leadingVar, '1.3'))),
			margin: 0,
			padding: 0,
		},
		defaultVariants: { color: 'text', leading: 'snug', size: 'sm' },
		variants: {
			align: { center: { textAlign: 'center' }, left: { textAlign: 'left' }, right: { textAlign: 'right' } },
			color: variantsFor(colors, 'color'),
			leading: varVariantsFor(lineHeight, leadingVar),
			size: varVariantsFor(fontSize, fontSizeVar),
			weight: variantsFor(fontWeight, 'fontWeight'),
		},
	},
	{ debugId: 'text', layer: components },
);

/** Set per-instance via `assignInlineVars` — the only value that can't be known at build time. */
export const lineClampVar = createVar();

export const clampSingleLine = style({
	'@layer': {
		[components]: {
			maxWidth: '100%',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		},
	},
});

export const clampMultiLine = style({
	'@layer': {
		[components]: {
			display: '-webkit-box',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			WebkitBoxOrient: 'vertical',
			WebkitLineClamp: lineClampVar,
		},
	},
});

export const userSelect = styleVariants({
	none: { '@layer': { [components]: { userSelect: 'none' } } },
	text: { '@layer': { [components]: { userSelect: 'text' } } },
});
