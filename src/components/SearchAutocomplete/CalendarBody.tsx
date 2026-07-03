import { Autocomplete } from '@base-ui/react/autocomplete';

import {
	ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './CalendarBody.css';
import type { DateItem } from './model';

/**
 * calendar grid for selecting a date. rendered as Autocomplete rows/items to share keyboard navigation under
 * the root's grid layout.
 *
 * @param days 42-cell month grid in row-major order
 * @param onGoToMonth callback to step the visible month by the given offset
 * @param visibleMonth month currently displayed
 */
export function CalendarBody({
	days,
	onGoToMonth,
	visibleMonth,
}: {
	days: DateItem[];
	onGoToMonth: (delta: number) => void;
	visibleMonth: Date;
}) {
	const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
	const weekdays = days.slice(0, 7);

	const weeks: DateItem[][] = [];
	for (let i = 0; i < days.length; i += 7) {
		weeks.push(days.slice(i, i + 7));
	}

	return (
		<div className={styles.root}>
			<Button
				className={styles.navPrevious}
				color="secondary"
				label={m['components.web.calendar.action.previousMonth']()}
				onClick={() => onGoToMonth(-1)}
				// keep the text input focused so keyboard navigation survives a month change.
				onMouseDown={(event) => event.preventDefault()}
				shape="round"
				size="small"
				variant="ghost"
			>
				<ButtonIcon icon={ChevronLeftIcon} size="sm" />
			</Button>

			<Text className={styles.month} weight="semiBold">
				{monthLabel}
			</Text>

			<Button
				className={styles.navNext}
				color="secondary"
				label={m['components.web.calendar.action.nextMonth']()}
				onClick={() => onGoToMonth(1)}
				onMouseDown={(event) => event.preventDefault()}
				shape="round"
				size="small"
				variant="ghost"
			>
				<ButtonIcon icon={ChevronRightIcon} size="sm" />
			</Button>

			<div className={styles.weekdays} role="presentation">
				{weekdays.map((day) => (
					<Text className={styles.weekday} color="textContrastMedium" key={day.key}>
						{day.date.toLocaleDateString(undefined, { weekday: 'short' })}
					</Text>
				))}
			</div>

			{weeks.map((week) => (
				<Autocomplete.Row className={styles.week} key={week[0]!.key}>
					{week.map((day) => (
						<Autocomplete.Item
							className={styles.day({ selected: day.selected, today: day.today })}
							disabled={day.disabled}
							key={day.key}
							value={day}
						>
							<Text color={day.selected ? 'text' : day.disabled || !day.inMonth ? 'textContrastLow' : 'text'}>
								{day.date.getDate()}
							</Text>
						</Autocomplete.Item>
					))}
				</Autocomplete.Row>
			))}
		</div>
	);
}
