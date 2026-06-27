import type { I18n } from '@lingui/core';

import { m } from '#/paraglide/messages';

export function niceDate(
	i18n: I18n,
	date: number | string | Date,
	dateStyle: 'short' | 'medium' | 'long' | 'full' | 'dot separated' = 'long',
	timeStyle: 'short' | 'medium' | 'long' | 'full' | 'none' = 'short',
) {
	const ts = timeStyle === 'none' ? undefined : timeStyle;
	const d = new Date(date);

	if (dateStyle === 'dot separated') {
		return m['lib.time.dateTime']({
			date: i18n.date(d, { dateStyle: 'medium' }),
			time: i18n.date(d, { timeStyle: ts }),
		});
	}

	return i18n.date(d, {
		dateStyle,
		timeStyle: ts,
	});
}
