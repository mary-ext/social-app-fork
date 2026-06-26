import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontFamily, fontLeading, fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

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

// font-size and the leading ratio are published as vars so the `size`/`leading` variants only assign them
// and `base` derives the actual `font-size` and pixel-snapped `line-height` from both. `size` publishes its
// font-size (`fontSizeVar`) and its Tailwind-paired leading ratio (`sizeLeadingVar`); `leading` publishes
// the final ratio (`leadingOverrideVar`), defaulting (`snug`) to the size's paired ratio. all three are
// exported so another recipe can retune one alone — override `fontSizeVar` and the paired line-height
// follows; set `sizeLeadingVar` to re-pair a resized element; set `leadingOverrideVar` to force a ratio.
export const fontSizeVar = createVar();
export const sizeLeadingVar = createVar();
export const leadingOverrideVar = createVar();

const fontSizeScale = fallbackVar(fontSizeVar, fontSize.md);
const pairedLeading = fallbackVar(sizeLeadingVar, String(fontLeading.md));
const leading = fallbackVar(leadingOverrideVar, pairedLeading);

/** `size` variant: each token publishes its font-size and its paired leading ratio. */
const sizeVariants = (): { [K in keyof typeof fontLeading]: { vars: Record<string, string> } } => {
	const out: Record<string, { vars: Record<string, string> }> = {};
	for (const key of Object.keys(fontLeading) as (keyof typeof fontLeading)[]) {
		out[key] = { vars: { [fontSizeVar]: fontSize[key], [sizeLeadingVar]: String(fontLeading[key]) } };
	}
	return out as { [K in keyof typeof fontLeading]: { vars: Record<string, string> } };
};

export const text = recipe(
	{
		base: {
			fontFamily,
			fontSize: fontSizeScale,
			// snap the derived line-height to a whole CSS pixel — `round(fontSize * leading, 1px)` — so it
			// lands on the pixel grid rather than a fractional CSS value
			lineHeight: roundToPx(`calc(${fontSizeScale} * ${leading})`),
			margin: 0,
			overflowWrap: 'break-word',
			padding: 0,
			whiteSpace: 'pre-wrap',
		},
		defaultVariants: { color: 'text', leading: 'snug', size: 'md' },
		variants: {
			align: { center: { textAlign: 'center' }, left: { textAlign: 'left' }, right: { textAlign: 'right' } },
			color: variantsFor(colors, 'color'),
			// `snug` (default) follows the size's paired ratio; `none` removes leading. a tighter heading sets
			// `leadingOverrideVar` from its own CSS rather than going through a variant.
			leading: {
				none: { vars: { [leadingOverrideVar]: String(lineHeight.none) } },
				snug: { vars: { [leadingOverrideVar]: pairedLeading } },
			},
			size: sizeVariants(),
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
			minWidth: 0,
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
