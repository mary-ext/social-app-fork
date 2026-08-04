/** skin-tone modifiers for tones 2-6. */
export const SKIN_TONE_MODIFIERS = [0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff];
const VARIATION_SELECTOR = 0xfe0f;

/**
 * adds a skin-tone modifier to a glyph.
 *
 * @param native default-tone glyph
 * @param tone skin tone, 1-6
 * @param modifierBases code points that accept modifiers
 * @returns the tone-adjusted glyph
 */
export function applySkinTone(native: string, tone: number, modifierBases: ReadonlySet<number>): string {
	const modifier = SKIN_TONE_MODIFIERS[tone - 2];
	if (modifier === undefined) {
		return native;
	}

	// oxlint-disable-next-line typescript/no-misused-spread -- iterate by Unicode code point
	const points = [...native].map((char) => char.codePointAt(0)!);
	const out: number[] = [];
	for (let i = 0; i < points.length; i++) {
		out.push(points[i]!);
		if (modifierBases.has(points[i]!)) {
			out.push(modifier);
			if (points[i + 1] === VARIATION_SELECTOR) {
				i++;
			}
		}
	}
	return String.fromCodePoint(...out);
}
