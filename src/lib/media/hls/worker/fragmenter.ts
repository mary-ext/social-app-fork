import type { MuxSample } from './mp4';
import { MPEG_TS_TIMESCALE, type DemuxedSamples, type RawAudioSample, type RawVideoSample } from './mpeg-ts';

export type FragmentTiming = {
	/** presentation origin in MPEG-TS ticks. */
	base: number;
	/** decode origin in MPEG-TS ticks. */
	decodeBase: number;
	/** AAC sample rate in Hz; undefined for video-only segments. */
	sampleRate: number | undefined;
};

/**
 * prepares one segment's demuxed samples for MP4 fragments.
 *
 * @returns segment fragmenter
 */
export const createFragmenter = () => {
	let video: RawVideoSample[] = [];
	let audio: RawAudioSample[] = [];
	let previousDuration = MPEG_TS_TIMESCALE / 30;

	// cut only between presentation-ordered groups so `buffered` never spans missing frames.
	// retain the last group: later chunks may contain its reordered frames.
	const cutPoint = () => {
		const earliestAfter: number[] = [];
		let earliest = Infinity;
		for (let index = video.length - 1; index >= 0; index--) {
			earliest = Math.min(earliest, video[index]!.pts);
			earliestAfter[index] = earliest;
		}

		let cut = 0;
		let candidate = 0;
		let latest = -Infinity;
		for (const [index, sample] of video.entries()) {
			if (index > 0 && earliestAfter[index]! > latest) {
				cut = candidate;
				candidate = index;
			}
			latest = Math.max(latest, sample.pts);
		}

		return cut;
	};

	const takeCounts = ({
		audioCount,
		base,
		decodeBase,
		sampleRate,
		videoCount,
	}: FragmentTiming & { audioCount: number; videoCount: number }) => {
		const muxedVideo: MuxSample[] = [];
		const muxedAudio: MuxSample[] = [];

		for (let index = 0; index < videoCount; index++) {
			const sample = video[index]!;
			const next = video[index + 1];
			if (next) {
				previousDuration = next.dts - sample.dts;
			}
			muxedVideo.push({
				data: sample.data,
				// playlist/transport drift can put earlier segments before a mid-stream decode origin.
				dts: Math.max(sample.dts - decodeBase, 0),
				duration: previousDuration,
				key: sample.key,
				pts: sample.pts - base,
			});
		}

		if (sampleRate !== undefined) {
			for (let index = 0; index < audioCount; index++) {
				const sample = audio[index]!;
				const dts = Math.round(((sample.pts - base) * sampleRate) / MPEG_TS_TIMESCALE);
				if (dts < 0) {
					continue;
				}

				const next = audio[index + 1];
				const duration = next ? Math.round(((next.pts - sample.pts) * sampleRate) / MPEG_TS_TIMESCALE) : 1024;
				muxedAudio.push({ data: sample.data, dts, duration, key: true, pts: dts });
			}
		}

		video = video.slice(videoCount);
		audio = audio.slice(audioCount);

		return { audio: muxedAudio, video: muxedVideo };
	};

	return {
		/**
		 * queues demuxed samples.
		 *
		 * @param samples samples completed by the latest chunk
		 */
		add(samples: DemuxedSamples) {
			video.push(...samples.video);
			audio.push(...samples.audio);
		},
		/**
		 * takes all remaining samples when the segment ends.
		 *
		 * @param timing fragment timeline
		 * @returns fragment samples
		 * @throws when no video samples are queued
		 */
		drain(timing: FragmentTiming) {
			if (video.length === 0) {
				throw new Error('MPEG-TS segment contains no video');
			}
			return takeCounts({ ...timing, audioCount: audio.length, videoCount: video.length });
		},
		/** @returns earliest queued video DTS in MPEG-TS ticks; requires queued video */
		get earliestDts() {
			return video[0]!.dts;
		},
		/** @returns earliest queued video PTS in MPEG-TS ticks; requires queued video */
		get earliestPts() {
			return Math.min(...video.map((sample) => sample.pts));
		},
		/** @returns queued video's decode span in MPEG-TS ticks; zero with fewer than two samples */
		get queuedDuration() {
			return video.length > 1 ? video[video.length - 1]!.dts - video[0]!.dts : 0;
		},
		/**
		 * takes a fragment without splitting reordered frames.
		 *
		 * @param timing fragment timeline
		 * @returns fragment samples; empty arrays when no safe cut is available
		 */
		take(timing: FragmentTiming) {
			const videoCount = cutPoint();
			if (videoCount === 0) {
				return { audio: [], video: [] };
			}
			// retain the last audio sample until its successor supplies the duration.
			return takeCounts({ ...timing, audioCount: Math.max(audio.length - 1, 0), videoCount });
		},
	};
};
