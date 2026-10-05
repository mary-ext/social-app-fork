/**
 * formats a media position or duration as `m:ss`, rounded to the nearest second.
 *
 * @param time the time in seconds
 * @returns the formatted time, or `--` for NaN
 */
export function formatTime(time: number): string {
	if (isNaN(time)) {
		return '--';
	}

	time = Math.round(time);

	const minutes = Math.floor(time / 60);
	const seconds = String(time % 60).padStart(2, '0');

	return `${minutes}:${seconds}`;
}
