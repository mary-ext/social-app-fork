import { memo } from 'react';
import { View } from 'react-native';
import { subDays } from 'date-fns';

import { clockNumeric, weekdayLong, weekdayMonthDay, weekdayMonthDayYear } from '#/locale/intl/datetime';

import { atoms as a, useTheme } from '#/alf';

import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { localDateString } from './util';

let DateDivider = ({ date: dateStr }: { date: string }): React.ReactNode => {
	const t = useTheme();
	let date: string;
	const time = clockNumeric.format(new Date(dateStr));

	const timestamp = new Date(dateStr);

	const today = new Date();
	const yesterday = subDays(today, 1);
	const oneWeekAgo = subDays(today, 7);

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
		<View style={[a.w_full, a.mt_md]}>
			<Text style={[a.text_xs, a.text_center, t.atoms.text_contrast_medium, a.px_md]}>
				{m['components.dms.time.dateAtTime']({ date, time })}
			</Text>
		</View>
	);
};
DateDivider = memo(DateDivider);
export { DateDivider };
