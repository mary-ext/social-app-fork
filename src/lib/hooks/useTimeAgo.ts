import type { I18n } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { differenceInSeconds } from 'date-fns';

import { m } from '#/paraglide/messages';

export type DateDiffFormat = 'long' | 'short';

type DateDiff = {
	value: number;
	unit: 'now' | 'second' | 'minute' | 'hour' | 'day' | 'month';
	earlier: Date;
	later: Date;
};

const NOW = 5;
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH_30 = DAY * 30;

export function useGetTimeAgo({ future = false }: { future?: boolean } = {}) {
	const { i18n } = useLingui();
	return (
		earlier: number | string | Date,
		later: number | string | Date,
		options?: { format: DateDiffFormat },
	) => {
		const diff = dateDiff(earlier, later, future ? 'up' : 'down');
		return formatDateDiff({ diff, i18n, format: options?.format });
	};
}

/**
 * Returns the difference between `earlier` and `later` dates, based on opinionated rules.
 *
 * - All month are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - All values round down
 */
export function dateDiff(
	earlier: number | string | Date,
	later: number | string | Date,
	rounding: 'up' | 'down' = 'down',
): DateDiff {
	let diff = {
		value: 0,
		unit: 'now' as DateDiff['unit'],
	};
	const e = new Date(earlier);
	const l = new Date(later);
	const diffSeconds = differenceInSeconds(l, e);

	if (diffSeconds < NOW) {
		diff = {
			value: 0,
			unit: 'now',
		};
	} else if (diffSeconds < MINUTE) {
		diff = {
			value: diffSeconds,
			unit: 'second',
		};
	} else if (diffSeconds < HOUR) {
		const value = rounding === 'up' ? Math.ceil(diffSeconds / MINUTE) : Math.floor(diffSeconds / MINUTE);
		diff = {
			value,
			unit: 'minute',
		};
	} else if (diffSeconds < DAY) {
		const value = rounding === 'up' ? Math.ceil(diffSeconds / HOUR) : Math.floor(diffSeconds / HOUR);
		diff = {
			value,
			unit: 'hour',
		};
	} else if (diffSeconds < MONTH_30) {
		const value = rounding === 'up' ? Math.ceil(diffSeconds / DAY) : Math.floor(diffSeconds / DAY);
		diff = {
			value,
			unit: 'day',
		};
	} else {
		const value = rounding === 'up' ? Math.ceil(diffSeconds / MONTH_30) : Math.floor(diffSeconds / MONTH_30);
		diff = {
			value,
			unit: 'month',
		};
	}

	return {
		...diff,
		earlier: e,
		later: l,
	};
}

/**
 * Accepts a `DateDiff` and teturns the difference between `earlier` and `later` dates, formatted as a natural
 * language string.
 *
 * - All month are considered exactly 30 days.
 * - Dates assume `earlier` <= `later`, and will otherwise return 'now'.
 * - Differences >= 360 days are returned as the "M/D/YYYY" string
 * - All values round down
 */
export function formatDateDiff({
	diff,
	format = 'short',
	i18n,
}: {
	diff: DateDiff;
	format?: DateDiffFormat;
	i18n: I18n;
}): string {
	const long = format === 'long';

	switch (diff.unit) {
		case 'now': {
			return m['lib.time.now']();
		}
		case 'second': {
			return long
				? m['lib.time.seconds']({ value: diff.value })
				: m['lib.time.secondsNarrow']({ value: diff.value });
		}
		case 'minute': {
			return long
				? m['lib.time.minutes']({ value: diff.value })
				: m['lib.time.minutesNarrow']({ value: diff.value });
		}
		case 'hour': {
			return long
				? m['lib.time.hours']({ value: diff.value })
				: m['lib.time.hoursNarrow']({ value: diff.value });
		}
		case 'day': {
			return long
				? m['lib.time.days']({ value: diff.value })
				: m['lib.time.daysNarrow']({ value: diff.value });
		}
		case 'month': {
			if (diff.value < 12) {
				return long
					? m['lib.time.months']({ value: diff.value })
					: m['lib.time.monthsNarrow']({ value: diff.value });
			}
			return i18n.date(new Date(diff.earlier));
		}
	}
}
