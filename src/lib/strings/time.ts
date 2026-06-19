import type { I18n } from '@lingui/core';
import { defineMessage } from '@lingui/core/macro';

export function niceDate(
	i18n: I18n,
	date: number | string | Date,
	dateStyle: 'short' | 'medium' | 'long' | 'full' | 'dot separated' = 'long',
	timeStyle: 'short' | 'medium' | 'long' | 'full' | 'none' = 'short',
) {
	const ts = timeStyle === 'none' ? undefined : timeStyle;
	const d = new Date(date);

	if (dateStyle === 'dot separated') {
		return i18n._(
			defineMessage({
				context: 'date and time formatted like this: [time] · [date]',
				message: `${i18n.date(d, { timeStyle: ts })} · ${i18n.date(d, { dateStyle: 'medium' })}`,
			}),
		);
	}

	return i18n.date(d, {
		dateStyle,
		timeStyle: ts,
	});
}
