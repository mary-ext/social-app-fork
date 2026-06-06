import { createVar, style, styleVariants } from '@vanilla-extract/css';

import { recipe } from '#/components/web/css/recipe';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

const FONT_FAMILY = `InterVariable, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`;

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

export const text = recipe(
	{
		base: { fontFamily: FONT_FAMILY, margin: 0, padding: 0 },
		defaultVariants: { color: 'text', leading: 'none', size: 'sm' },
		variants: {
			align: { center: { textAlign: 'center' }, left: { textAlign: 'left' }, right: { textAlign: 'right' } },
			color: variantsFor(colors, 'color'),
			leading: variantsFor(lineHeight, 'lineHeight'),
			size: variantsFor(fontSize, 'fontSize'),
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
