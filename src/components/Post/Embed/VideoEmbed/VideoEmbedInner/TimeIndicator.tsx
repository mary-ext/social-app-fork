import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { Text } from '#/components/Text';

import * as styles from './TimeIndicator.css';

/** Absolutely positioned time indicator showing how many seconds are remaining. Time is in seconds. */
export function TimeIndicator({ time }: { time: number }) {
	const { t: l } = useLingui();

	if (isNaN(time)) {
		return null;
	}

	const minutes = Math.floor(time / 60);
	const seconds = String(time % 60).padStart(2, '0');

	return (
		<div
			aria-label={l`Time remaining: ${plural(Number(time) || 0, {
				one: '# second',
				other: '# seconds',
			})}`}
			className={styles.indicator}
		>
			<Text size="sm" weight="semiBold" className={styles.text}>
				{`${minutes}:${seconds}`}
			</Text>
		</div>
	);
}
