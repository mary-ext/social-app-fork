import { createVar, fallbackVar, style, styleVariants } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontLeading, fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

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

export const fontSizeVar = createVar();
export const sizeLeadingVar = createVar();
export const leadingOverrideVar = createVar();

const fontSizeScale = fallbackVar(fontSizeVar, fontSize.md);
const pairedLeading = fallbackVar(sizeLeadingVar, String(fontLeading.md));
const leading = fallbackVar(leadingOverrideVar, pairedLeading);

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
			margin: 0,
			padding: 0,
			lineHeight: roundToPx(`calc(${fontSizeScale} * ${leading})`),
			whiteSpace: 'pre-wrap',
			overflowWrap: 'break-word',
			fontFamily: 'inherit',
			fontSize: fontSizeScale,
		},
		defaultVariants: { color: 'text', leading: 'snug', size: 'md' },
		variants: {
			align: { center: { textAlign: 'center' }, left: { textAlign: 'left' }, right: { textAlign: 'right' } },
			color: variantsFor(colors, 'color'),
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

export const lineClampVar = createVar();

export const clampSingleLine = style({
	'@layer': {
		[components]: {
			minWidth: 0,
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
