import { createFragmenter } from './fragmenter';
import { createMp4InitSegment, createMp4MediaSegment, type MuxSample } from './mp4';
import { createMpegTsDemuxer, MPEG_TS_TIMESCALE } from './mpeg-ts';
import type { MediaSegment, VideoVariant } from './playlist';

const FRAGMENT_DURATION = MPEG_TS_TIMESCALE / 2;

/** MP4 timeline origins in MPEG-TS ticks. */
export type Timeline = { base: number; decodeBase: number };

type RemuxSink = {
	/** called once before the first chunk with the MediaSource MIME type. */
	init: (mimeType: string) => void;
	/** called with each init or media segment. */
	chunk: (data: Uint8Array<ArrayBuffer>) => void;
};

/**
 * converts a rendition's MPEG-TS segments to fragmented MP4.
 *
 * @param variant rendition being remuxed
 * @param resolveTimeline chooses the shared timeline from the segment's proposed origins
 * @param sink output receiver
 * @returns rendition remuxer
 */
export const createRemuxer = (
	variant: VideoVariant,
	resolveTimeline: (proposed: Timeline) => Timeline,
	sink: RemuxSink,
) => {
	let initialized = false;
	let sequence = 1;

	const emit = ({ audio, video }: { audio: MuxSample[]; video: MuxSample[] }) => {
		if (video.length > 0) {
			sink.chunk(createMp4MediaSegment(sequence++, video, audio));
		}
	};

	return {
		/**
		 * remuxes one segment.
		 *
		 * @param segment segment being remuxed
		 * @param body segment bytes
		 * @param options.progressive emit fragments while reading instead of once at the end
		 * @param options.active returns whether the request is still current; false stops remuxing
		 * @returns whether the segment completed
		 * @throws if reading or remuxing fails
		 */
		async remux(
			segment: MediaSegment,
			body: ReadableStream<Uint8Array>,
			{ progressive, active }: { progressive: boolean; active: () => boolean },
		) {
			const demuxer = createMpegTsDemuxer();
			const fragmenter = createFragmenter();

			const initialize = () => {
				const avc = demuxer.avc;
				if (!avc) {
					throw new Error('H.264 segment contains no decoder configuration');
				}

				const audioConfig = demuxer.audioConfig;
				const codecs = [avc.codec];

				initialized = true;

				if (audioConfig) {
					codecs.push(`mp4a.40.${audioConfig.objectType}`);
				}

				sink.init(`video/mp4; codecs="${codecs.join(',')}"`);
				sink.chunk(createMp4InitSegment(variant, avc, audioConfig));
			};
			// wait for declared audio so the init segment includes its track.
			const configured = () =>
				demuxer.avc !== undefined && (!variant.hasAudio || demuxer.audioConfig !== undefined);
			let timeline: Timeline | undefined;
			const timing = () => {
				if (!timeline) {
					const start = Math.round(segment.start * MPEG_TS_TIMESCALE);
					// anchor both timelines at the segment start without making B-frame DTS negative.
					timeline = resolveTimeline({
						base: fragmenter.earliestPts - start,
						decodeBase: fragmenter.earliestDts - start,
					});
				}
				return { ...timeline, sampleRate: demuxer.audioConfig?.sampleRate };
			};
			for await (const chunk of body) {
				if (!active()) {
					return false;
				}

				fragmenter.add(demuxer.push(chunk));
				if (!progressive || fragmenter.queuedDuration < FRAGMENT_DURATION) {
					continue;
				}
				if (!initialized) {
					if (!configured()) {
						continue;
					}
					initialize();
				}
				emit(fragmenter.take(timing()));
			}
			if (!active()) {
				return false;
			}

			fragmenter.add(demuxer.end());
			if (!initialized) {
				initialize();
			}
			emit(fragmenter.drain(timing()));
			return true;
		},
	};
};
