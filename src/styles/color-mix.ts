/**
 * mixes a color with transparent to create a translucent tint.
 *
 * @param color CSS color
 * @param opacity CSS percentage
 * @returns the color-mix expression
 */
export const colorMix = (color: string, opacity: string) =>
	`color-mix(in srgb, ${color} ${opacity}, transparent)`;
