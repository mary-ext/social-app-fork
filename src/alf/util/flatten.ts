import { type DimensionValue, StyleSheet } from 'react-native';

export const flatten = StyleSheet.flatten;

/** coerces a style value to a number. non-numeric values are treated as 0. */
function num(v: unknown): number {
	return typeof v === 'number' ? v : 0;
}

interface PaddingStyle {
	padding?: DimensionValue;
	paddingHorizontal?: DimensionValue;
	paddingVertical?: DimensionValue;
	paddingTop?: DimensionValue;
	paddingBottom?: DimensionValue;
	paddingLeft?: DimensionValue;
	paddingRight?: DimensionValue;
}

/**
 * extract resolved padding values from a style object.
 *
 * resolves shorthand properties and treats non-numeric values as 0.
 *
 * @param style the style object to extract padding from
 * @returns an object containing the resolved padding values for top, right, bottom, and left
 */
export function extractPadding(style: PaddingStyle | PaddingStyle[]) {
	const s = flatten(style) ?? {};
	const base = num(s.padding);
	return {
		paddingTop: num(s.paddingTop) || num(s.paddingVertical) || base,
		paddingBottom: num(s.paddingBottom) || num(s.paddingVertical) || base,
		paddingLeft: num(s.paddingLeft) || num(s.paddingHorizontal) || base,
		paddingRight: num(s.paddingRight) || num(s.paddingHorizontal) || base,
	};
}
