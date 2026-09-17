/**
 * applies an alpha to a color by mixing it with transparent.
 *
 * @param color CSS color
 * @param alpha CSS percentage
 * @returns the color-mix expression
 */
export const withAlpha = (color: string, alpha: string) =>
	`color-mix(in srgb, ${color} ${alpha}, transparent)`;
