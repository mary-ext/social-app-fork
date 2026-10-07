/** a buffered time range in seconds. */
export type BufferedRange = [start: number, end: number];

// timestamp drift and uneven track boundaries can leave gaps browsers won't cross.
const MAX_GAP = 0.5;
// seek inside the range to avoid boundary rounding.
const GAP_LANDING = 0.05;

const STALL_MARGIN = 0.5;

/**
 * finds the buffered range covering a time, tolerating a small gap before its start.
 *
 * @param ranges buffered ranges
 * @param time position in seconds
 * @returns the covering range, if any
 */
export const bufferedRangeAt = (ranges: BufferedRange[], time: number) => {
	return ranges.find(([start, end]) => time >= start - MAX_GAP && time <= end);
};

/**
 * @param duration media duration in seconds
 * @param time position in seconds
 * @returns whether the position is within the stall margin of the media's end
 */
export const isNearEnd = (duration: number, time: number) => duration - time < STALL_MARGIN;

/**
 * @param duration media duration in seconds
 * @param ranges buffered ranges
 * @param time position in seconds
 * @returns whether buffering at the position is sufficient for stall detection
 */
export const isBufferedAt = (duration: number, ranges: BufferedRange[], time: number) => {
	const range = bufferedRangeAt(ranges, time);
	if (!range) {
		return false;
	}

	// short clips and final frames may have less than a full stall margin buffered.
	return range[1] - time > STALL_MARGIN || isNearEnd(duration, range[1]);
};

/**
 * seeks the playhead across a small gap to the next buffered range.
 *
 * @param video video element
 * @param ranges buffered ranges
 * @returns whether the playhead was moved
 */
export const jumpGap = (video: HTMLVideoElement, ranges: BufferedRange[]) => {
	if (video.seeking) {
		return false;
	}

	// a stuck playhead can sit a few frames short of the end of its range.
	const time = video.currentTime;
	const current = ranges.find(([start, end]) => time >= start && time <= end);
	if (current && current[1] - time > MAX_GAP) {
		return false;
	}

	const edge = current?.[1] ?? time;
	const next = ranges.find(([start]) => start > edge && start - edge <= MAX_GAP);
	if (!next) {
		return false;
	}

	video.currentTime = Math.min(next[0] + GAP_LANDING, next[1]);
	return true;
};
