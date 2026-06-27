import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './TimeIndicator.css';

/** Absolutely positioned time indicator showing how many seconds are remaining. Time is in seconds. */
export function TimeIndicator({ time }: { time: number }) {
	if (isNaN(time)) {
		return null;
	}

	const minutes = Math.floor(time / 60);
	const seconds = String(time % 60).padStart(2, '0');

	return (
		<div
			aria-label={m['components.post.video.a11y.timeRemaining']({
				time: Number(time) || 0,
			})}
			className={styles.indicator}
		>
			<Text size="sm" weight="semiBold" className={styles.text}>
				{`${minutes}:${seconds}`}
			</Text>
		</div>
	);
}
