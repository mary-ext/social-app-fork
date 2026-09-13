import { VIDEO_MAX_SIZE } from '#/lib/constants/video';

// short-edge tiers, largest first. retain detail in the stored master when the budget allows.
const RESOLUTION_TIERS = [2160, 1440, 1080, 720];

// target bits per pixel per frame for AVC.
const TARGET_BPP = 0.1;

// reserve 10% for bitrate overshoot and container overhead.
const SIZE_BUDGET = 0.9;

const FALLBACK_FRAME_RATE = 30;

/** keyframe interval in seconds, chosen for the service's segmenter. */
export const KEY_FRAME_INTERVAL = 3;

/** audio bitrate budget and encoder target, in bits per second. */
export const AUDIO_BITRATE = 128_000;

/** minimum video bitrate, in bits per second. */
export const MIN_VIDEO_BITRATE = 300_000;

export type EncodePlan = {
	width: number;
	height: number;
	videoBitrate: number;
	audioBitrate: number;
};

export type PlanInput = {
	width: number;
	height: number;
	frameRate: number;
	/** duration in seconds, or 0 when it could not be measured */
	durationS: number;
	hasAudio: boolean;
	/** measured source bitrate in bits per second, or null when it could not be measured */
	sourceBitrate: number | null;
};

const roundToEven = (value: number) => Math.max(2, Math.round(value / 2) * 2);

const scaleToShortEdge = (width: number, height: number, shortEdge: number) => {
	const scale = shortEdge / Math.min(width, height);
	return { width: roundToEven(width * scale), height: roundToEven(height * scale) };
};

/**
 * estimates a total bitrate budget from the upload size limit.
 *
 * @param durationS duration in seconds; 0 when it could not be measured
 * @returns the bitrate ceiling in bits per second, or `Infinity` for an unknown duration
 */
export function bitrateBudget(durationS: number): number {
	if (durationS <= 0) {
		return Infinity;
	}

	return (VIDEO_MAX_SIZE * 8 * SIZE_BUDGET) / durationS;
}

/**
 * chooses the largest resolution tier within the estimated bitrate budget, without upscaling.
 *
 * @param input source dimensions, frame rate, duration, and measured bitrate
 * @returns the dimensions and bitrates to encode with
 */
export function planEncode({
	width,
	height,
	frameRate,
	durationS,
	hasAudio,
	sourceBitrate,
}: PlanInput): EncodePlan {
	const fps = frameRate > 0 ? frameRate : FALLBACK_FRAME_RATE;
	const shortEdge = Math.min(width, height);
	const budget = bitrateBudget(durationS) - (hasAudio ? AUDIO_BITRATE : 0);

	for (const tier of RESOLUTION_TIERS) {
		if (tier > shortEdge) {
			continue;
		}

		const scaled = scaleToShortEdge(width, height, tier);

		// cap the estimate at the source bitrate to avoid spending bits on detail already lost.
		const required = Math.min(TARGET_BPP * scaled.width * scaled.height * fps, sourceBitrate ?? Infinity);
		if (required <= budget) {
			return {
				...scaled,
				videoBitrate: Math.round(Math.max(MIN_VIDEO_BITRATE, required)),
				audioBitrate: AUDIO_BITRATE,
			};
		}
	}

	// fall back to the smallest tier without upscaling smaller sources.
	const smallest = RESOLUTION_TIERS[RESOLUTION_TIERS.length - 1]!;

	return {
		...scaleToShortEdge(width, height, Math.min(shortEdge, smallest)),
		videoBitrate: Math.round(Math.max(MIN_VIDEO_BITRATE, budget)),
		audioBitrate: AUDIO_BITRATE,
	};
}
