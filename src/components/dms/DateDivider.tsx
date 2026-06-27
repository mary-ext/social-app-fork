import { memo } from 'react';
import { View } from 'react-native';
import { useLingui } from '@lingui/react/macro';
import { subDays } from 'date-fns';

import { atoms as a, useTheme } from '#/alf';

import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

import { localDateString } from './util';

let DateDivider = ({ date: dateStr }: { date: string }): React.ReactNode => {
	const t = useTheme();
	const { i18n } = useLingui();

	let date: string;
	const time = i18n.date(new Date(dateStr), {
		hour: 'numeric',
		minute: 'numeric',
	});

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
				date = i18n.date(timestamp, {
					weekday: 'short',
					month: 'long',
					day: 'numeric',
				});
			} else {
				date = i18n.date(timestamp, {
					weekday: 'short',
					month: 'long',
					day: 'numeric',
					year: 'numeric',
				});
			}
		} else {
			date = i18n.date(timestamp, { weekday: 'long' });
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
