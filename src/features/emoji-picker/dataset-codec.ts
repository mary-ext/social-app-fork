/** separator for encoded columns. */
export const RECORD = '\n';

/** ignored when counting glyph code points. */
const VARIATION_SELECTOR = '\u{FE0F}';

/**
 * returns whether a glyph contains multiple code points.
 *
 * @param glyph emoji glyph
 * @returns true for a sequence
 */
export function isSequence(glyph: string): boolean {
	let points = 0;
	for (const char of glyph) {
		if (char !== VARIATION_SELECTOR && ++points > 1) {
			return true;
		}
	}
	return false;
}

/**
 * turns an emoji id into a display name.
 *
 * @param id emoji id
 * @returns the display name
 */
export function titleCase(id: string): string {
	return id
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
