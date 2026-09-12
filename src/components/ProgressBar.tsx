import { clamp } from '#/lib/utils/numbers';

import * as styles from './ProgressBar.css';

/**
 * renders determinate progress.
 *
 * @param label accessible name
 * @param max total work; non-positive values render an empty track
 * @param value completed work; the fill is clamped to 0–100%
 * @param valueText accessible progress description
 * @returns the progress bar
 */
export function ProgressBar({
	label,
	max,
	value,
	valueText,
}: {
	label: string;
	max: number;
	value: number;
	valueText: string;
}) {
	const ratio = max > 0 ? clamp(value / max, 0, 1) : 0;
	return (
		<div
			aria-label={label}
			aria-valuemax={max}
			aria-valuemin={0}
			aria-valuenow={value}
			aria-valuetext={valueText}
			className={styles.track}
			role="progressbar"
		>
			<div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
		</div>
	);
}
