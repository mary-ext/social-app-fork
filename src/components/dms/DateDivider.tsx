import { memo } from 'react';

import { addDays } from '@mary/date-fns';

import { clockNumeric, weekdayLong, weekdayMonthDay, weekdayMonthDayYear } from '#/locale/intl/datetime';

import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './DateDivider.css';
import { localDateString } from './util';

let DateDivider = ({ date: dateStr }: { date: string }): React.ReactNode => {
	let date: string;
	const time = clockNumeric.format(new Date(dateStr));

	const timestamp = new Date(dateStr);

	const today = new Date();
	const yesterday = addDays(today, -1);
	const oneWeekAgo = addDays(today, -7);

	if (localDateString(today) === localDateString(timestamp)) {
		date = m['components.dms.time.today']();
	} else if (localDateString(yesterday) === localDateString(timestamp)) {
		date = m['components.dms.time.yesterday']();
	} else {
		if (timestamp < oneWeekAgo) {
			if (timestamp.getFullYear() === today.getFullYear()) {
				date = weekdayMonthDay.format(timestamp);
			} else {
				date = weekdayMonthDayYear.format(timestamp);
			}
		} else {
			date = weekdayLong.format(timestamp);
		}
	}

	return (
		<div className={css.root}>
			<Text color="textContrastMedium" size="xs">
				{m['components.dms.time.dateAtTime']({ date, time })}
			</Text>
		</div>
	);
};
DateDivider = memo(DateDivider);
export { DateDivider };
