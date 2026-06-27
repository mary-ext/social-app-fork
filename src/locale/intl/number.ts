import { LOCALE } from '#/locale/intl/locale';

// compact counts like "1.2K", "3.4M". `roundingMode: 'trunc'` so we never round a count up.
const compact = new Intl.NumberFormat(LOCALE, {
	maximumFractionDigits: 1,
	notation: 'compact',
	roundingMode: 'trunc',
});
// same, but whole-number — used for large post-stat counts (>= 10k) where a fractional digit reads as noise.
const compactWhole = new Intl.NumberFormat(LOCALE, {
	maximumFractionDigits: 0,
	notation: 'compact',
	roundingMode: 'trunc',
});

/**
 * Formats a count compactly (e.g. `1234` → `1.2K`).
 *
 * @param count the count to format
 * @returns the compact localized count
 */
export const formatCount = (count: number): string => compact.format(count);

/**
 * Formats a post-stat count compactly, dropping the fractional digit at or above 10,000 (e.g. `1234` →
 * `1.2K`, `12345` → `12K`).
 *
 * @param count the count to format
 * @returns the compact localized count
 */
export const formatPostStatCount = (count: number): string =>
	(count >= 10_000 ? compactWhole : compact).format(count);
