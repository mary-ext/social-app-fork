import { LOCALE } from '#/locale/intl/locale';

import { m } from '#/paraglide/messages';

// the set of date/time formats this app actually uses, each instantiated once. naming describes the
// rendered shape (en-US examples in comments).

/** "January 5, 2026" */
export const dateLong = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' });
/** "Jan 5, 2026" */
export const dateMedium = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });
/** "January 5, 2026 at 3:00 PM" */
export const dateTimeLong = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeStyle: 'short' });
/** "Jan 5, 2026, 3:00 PM" */
export const dateTimeMedium = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
/** "3:00 PM" */
export const timeShort = new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' });
/** "3:00 PM" (explicit 12-hour clock) */
export const clock = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', hour12: true, minute: '2-digit' });
/** "3:00 PM" (numeric minute, locale clock) */
export const clockNumeric = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: 'numeric' });
/** "January 5, 2026" (month/day/year parts) */
export const monthDayYear = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
});
/** "Mon, January 5" */
export const weekdayMonthDay = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'long',
	weekday: 'short',
});
/** "Mon, January 5, 2026" */
export const weekdayMonthDayYear = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'long',
	weekday: 'short',
	year: 'numeric',
});
/** "Monday" */
export const weekdayLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });

/**
 * Formats a date as a human-friendly string.
 *
 * @param date a `Date`, epoch millis, or date string
 * @param dateStyle the date portion; `'dot separated'` renders `time · date` for compact contexts
 * @param timeStyle the time portion, or `'none'` to omit it
 * @returns the localized date string
 */
export function niceDate(
	date: number | string | Date,
	dateStyle: 'dot separated' | 'long' | 'medium' = 'long',
	timeStyle: 'none' | 'short' = 'short',
) {
	const d = new Date(date);
	if (dateStyle === 'dot separated') {
		return m['lib.time.dateTime']({ date: dateMedium.format(d), time: timeShort.format(d) });
	}
	if (timeStyle === 'none') {
		return (dateStyle === 'medium' ? dateMedium : dateLong).format(d);
	}
	return (dateStyle === 'medium' ? dateTimeMedium : dateTimeLong).format(d);
}
