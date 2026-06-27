import { differenceInSeconds } from 'date-fns';

import { dateMedium } from '#/locale/intl/datetime';
import { LOCALE } from '#/locale/intl/locale';

import { m } from '#/paraglide/messages';

export type DateDiffFormat = 'long' | 'short';

type DateDiff = {
	earlier: Date;
	later: Date;
	unit: 'day' | 'hour' | 'minute' | 'month' | 'now' | 'second';
	value: number;
};

const NOW = 5;
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH_30 = DAY * 30;

// duration formatters, instantiated once. `unit` style with `unitDisplay` gives bare durations
// ("2 minutes" / "2m") with no "ago"/"in" — matching the prior compact timestamp UI. month narrow is
// special-cased to "2mo" because Intl's narrow month ("2m") collides with minute.
const unit = (u: 'day' | 'hour' | 'minute' | 'month' | 'second', display: 'long' | 'narrow') =>
	new Intl.NumberFormat(LOCALE, { style: 'unit', unit: u, unitDisplay: display });
const long = {
	day: unit('day', 'long'),
	hour: unit('hour', 'long'),
	minute: unit('minute', 'long'),
	month: unit('month', 'long'),
	second: unit('second', 'long'),
};
const narrow = {
	day: unit('day', 'narrow'),
	hour: unit('hour', 'narrow'),
	minute: unit('minute', 'narrow'),
	second: unit('second', 'narrow'),
};

/**
 * Returns the difference between `earlier` and `later` dates, based on opinionated rules.
 *
 * - All months are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - All values round down unless `rounding` is `'up'`.
 */
export function dateDiff(
	earlier: number | string | Date,
	later: number | string | Date,
	rounding: 'down' | 'up' = 'down',
): DateDiff {
	let diff = {
		unit: 'now' as DateDiff['unit'],
		value: 0,
	};
	const e = new Date(earlier);
	const l = new Date(later);
	const diffSeconds = differenceInSeconds(l, e);
	const round = (perUnit: number) =>
		rounding === 'up' ? Math.ceil(diffSeconds / perUnit) : Math.floor(diffSeconds / perUnit);

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

/**
 * Formats a `DateDiff` as a natural-language duration (no "ago"/"in" suffix).
 *
 * - `'short'` is compact ("2m", "2h", "2d", "2mo"); `'long'` is spelled out ("2 minutes").
 * - Differences of 12 months or more render as an absolute date instead.
 *
 * @returns the formatted duration string
 */
export function formatDateDiff({
	diff,
	format = 'short',
}: {
	diff: DateDiff;
	format?: DateDiffFormat;
}): string {
	const isLong = format === 'long';
	switch (diff.unit) {
		case 'now':
			return m['lib.time.now']();
		case 'second':
			return (isLong ? long.second : narrow.second).format(diff.value);
		case 'minute':
			return (isLong ? long.minute : narrow.minute).format(diff.value);
		case 'hour':
			return (isLong ? long.hour : narrow.hour).format(diff.value);
		case 'day':
			return (isLong ? long.day : narrow.day).format(diff.value);
		case 'month':
			if (diff.value >= 12) {
				return dateMedium.format(diff.earlier);
			}
			return isLong ? long.month.format(diff.value) : `${diff.value}mo`;
	}
}

/**
 * Returns a function that formats the elapsed time between two dates.
 *
 * @param future when true, rounds durations up (for countdowns) instead of down
 * @returns `(earlier, later, options?) => string`
 */
export function useGetTimeAgo({ future = false }: { future?: boolean } = {}) {
	return (
		earlier: number | string | Date,
		later: number | string | Date,
		options?: { format: DateDiffFormat },
	) => formatDateDiff({ diff: dateDiff(earlier, later, future ? 'up' : 'down'), format: options?.format });
}
