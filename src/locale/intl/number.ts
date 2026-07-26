import { LOCALE } from '#/locale/intl/locale';

/**
 * compact counts like "1.23K", "12.3K", "123K", "1.23M". `roundingMode: 'trunc'` so we never round a count
 * up.
 */
const compact = new Intl.NumberFormat(LOCALE, {
	maximumSignificantDigits: 3,
	notation: 'compact',
	roundingMode: 'trunc',
});

/**
 * formats a count compactly (e.g. `1234` → `1.23K`).
 *
 * @param count the count to format
 * @returns the compact localized count
 */
export const formatCount = (count: number): string => compact.format(count);

/**
 * formats a post-stat count compactly (e.g. `1234` → `1.23K`).
 *
 * @param count the count to format
 * @returns the compact localized count
 */
export const formatPostStatCount = (count: number): string => compact.format(count);
