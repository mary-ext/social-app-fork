import { differenceInSeconds } from 'date-fns';

import { dateMedium, monthDay } from '#/locale/intl/datetime';
import { LOCALE } from '#/locale/intl/locale';

import { m } from '#/paraglide/messages';

type DateDiff = {
	earlier: Date;
	later: Date;
	unit: 'day' | 'hour' | 'minute' | 'month' | 'now' | 'second';
	value: number;
};

/** The recency buckets a `*Inputs` recency-variant message selects on. */
export type RelativeRecency = 'other' | 'this_week' | 'this_year';

/** Inputs a recency-variant message expects; see {@link relativeMessageParts}. */
export type RelativeMessageParts = {
	recency: RelativeRecency;
	/** ISO timestamp the message's `datetime` locals format. */
	ts: string;
	/** `Intl.RelativeTimeFormat` unit for the message's `relativetime` local. */
	unit: 'day' | 'hour' | 'minute' | 'month' | 'second';
	/** Signed magnitude (negative in the past, positive in the future) for the `relativetime` local. */
	value: number;
};

const NOW = 5;
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH_30 = DAY * 30;

// compact duration formatters, instantiated once. `unit` style with `unitDisplay: 'narrow'` gives bare
// durations ("2m", "2h", "2d") with no "ago"/"in". no day-or-larger formatter beyond these is needed:
// the time-ago path collapses to a calendar date once a week or older (see `isWeekOrOlder`).
const narrow = (u: 'day' | 'hour' | 'minute' | 'second') =>
	new Intl.NumberFormat(LOCALE, { style: 'unit', unit: u, unitDisplay: 'narrow' });
const compact = {
	day: narrow('day'),
	hour: narrow('hour'),
	minute: narrow('minute'),
	second: narrow('second'),
};

/**
 * returns the difference between `earlier` and `later` dates, based on opinionated rules.
 *
 * - all months are considered exactly 30 days.
 * - dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - all values round down.
 */
function dateDiff(earlier: number | string | Date, later: number | string | Date): DateDiff {
	let diff = {
		unit: 'now' as DateDiff['unit'],
		value: 0,
	};
	const e = new Date(earlier);
	const l = new Date(later);
	const diffSeconds = differenceInSeconds(l, e);
	const round = (perUnit: number) => Math.floor(diffSeconds / perUnit);

	if (diffSeconds < NOW) {
		diff = { unit: 'now', value: 0 };
	} else if (diffSeconds < MINUTE) {
		diff = { unit: 'second', value: diffSeconds };
	} else if (diffSeconds < HOUR) {
		diff = { unit: 'minute', value: round(MINUTE) };
	} else if (diffSeconds < DAY) {
		diff = { unit: 'hour', value: round(HOUR) };
	} else if (diffSeconds < MONTH_30) {
		diff = { unit: 'day', value: round(DAY) };
	} else {
		diff = { unit: 'month', value: round(MONTH_30) };
	}

	return { ...diff, earlier: e, later: l };
}

// the shared threshold: at a week or older, both the standalone timestamp and the recency messages
// drop the relative duration in favor of a calendar date.
const isWeekOrOlder = (diff: DateDiff) => diff.unit === 'month' || (diff.unit === 'day' && diff.value >= 7);

/**
 * formats the elapsed time between two dates as a compact, standalone timestamp (e.g., "2m", "2h", "5d", "5
 * Jan", or "5 Jan 2024").
 *
 * @returns the formatted timestamp
 */
export function formatTimeAgo(earlier: number | string | Date, later: number | string | Date): string {
	const diff = dateDiff(earlier, later);
	// a week or older — an exact "8d"/"3mo" reads as noise, so fall back to the calendar date,
	// dropping the year while it matches the reference ("later") year.
	const asDate = () =>
		(diff.earlier.getFullYear() === diff.later.getFullYear() ? monthDay : dateMedium).format(diff.earlier);
	if (isWeekOrOlder(diff)) {
		return asDate();
	}
	switch (diff.unit) {
		case 'now':
			return m['lib.time.now']();
		case 'second':
			return compact.second.format(diff.value);
		case 'minute':
			return compact.minute.format(diff.value);
		case 'hour':
			return compact.hour.format(diff.value);
		case 'day':
			return compact.day.format(diff.value);
		// 'month' can't reach here — `isWeekOrOlder` already returned — but the switch stays exhaustive.
		case 'month':
			return asDate();
	}
}

/**
 * decomposes the distance between `date` and `now` into inputs for a recency-variant message.
 *
 * @param date the timestamp being described
 * @param now the reference point ("now") the distance is measured from
 * @returns the `recency` selector plus the `ts`/`unit`/`value` formatting inputs
 */
export function relativeMessageParts(
	date: number | string | Date,
	now: number | string | Date,
): RelativeMessageParts {
	const target = new Date(date);
	const base = new Date(now);
	const isPast = target < base;
	const diff = dateDiff(isPast ? target : base, isPast ? base : target);
	let recency: RelativeRecency;
	if (!isWeekOrOlder(diff)) {
		recency = 'this_week';
	} else if (target.getFullYear() === base.getFullYear()) {
		recency = 'this_year';
	} else {
		recency = 'other';
	}
	return {
		recency,
		ts: target.toISOString(),
		// relativetime needs a concrete unit; dateDiff's 'now' collapses to 0 seconds ("now").
		unit: diff.unit === 'now' ? 'second' : diff.unit,
		value: isPast ? -diff.value : diff.value,
	};
}
