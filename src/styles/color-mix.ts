/**
 * Builds a CSS `color-mix()` that renders `color` at `opacity`, the remainder transparent — i.e. a
 * translucent tint. Unlike an overlay element, a translucent background paints _behind_ content, so it tints
 * a surface without darkening the text on top of it.
 *
 * @param color a CSS color (typically a themed `colors.*` var)
 * @param opacity a CSS percentage (typically a `vars.opacity.*` token, e.g. `50%`)
 * @returns the `color-mix(in srgb, …)` expression
 */
export const colorMix = (color: string, opacity: string) =>
	`color-mix(in srgb, ${color} ${opacity}, transparent)`;
