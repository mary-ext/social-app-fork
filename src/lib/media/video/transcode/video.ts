import {
	BlobSource,
	canEncodeVideo,
	Conversion,
	getFirstEncodableAudioCodec,
	Input,
	MATROSKA,
	MP4,
	MPEG_TS,
	Output,
	QTFF,
	Quality,
	WEBM,
	type AudioCodec,
	type InputAudioTrack,
	type VideoCodec,
} from 'mediabunny';

import { VIDEO_MAX_SIZE } from '#/lib/constants/video';

import { createBlobTarget } from './blob-target';
import { CONTAINERS, type ContainerName } from './containers';
import { planEncode, type EncodePlan } from './plan';
import type { TranscodeOutcome } from './protocol';

const INPUT_FORMATS = [MP4, QTFF, MATROSKA, WEBM, MPEG_TS];

// prefer AVC to match the service's H.264 output; fall back to WebM codecs.
// omit HEVC because the service cannot segment it.
const COMBOS: { container: ContainerName; video: VideoCodec; audio: AudioCodec[] }[] = [
	{ container: 'mp4', video: 'avc', audio: ['aac'] },
	{ container: 'webm', video: 'vp9', audio: ['opus', 'vorbis'] },
	{ container: 'webm', video: 'vp8', audio: ['opus', 'vorbis'] },
];

// keyframe interval in seconds, chosen for the service's segmenter.
const KEY_FRAME_INTERVAL = 3;

// packet sample size for bitrate and frame rate estimates.
const STATS_PACKETS = 100;

type Combo = {
	container: ContainerName;
	video: VideoCodec;
	audio: AudioCodec | null;
};

const pickCombo = async (plan: EncodePlan, audioTrack: InputAudioTrack | null): Promise<Combo | null> => {
	const quality = new Quality({ bitrate: plan.videoBitrate });

	const [needsAudio, encodableVideo] = await Promise.all([
		audioTrack?.canDecode() ?? false,
		Promise.all(
			COMBOS.map((combo) => canEncodeVideo(combo.video, { width: plan.width, height: plan.height, quality })),
		),
	]);

	// require compatible audio too; AVC without AAC support must fall back to WebM.
	for (const [index, combo] of COMBOS.entries()) {
		if (!encodableVideo[index]) {
			continue;
		}

		if (!needsAudio || audioTrack === null) {
			return { ...combo, audio: null };
		}

		const [numberOfChannels, sampleRate] = await Promise.all([
			audioTrack.getNumberOfChannels(),
			audioTrack.getSampleRate(),
		]);
		const audio = await getFirstEncodableAudioCodec(combo.audio, { numberOfChannels, sampleRate });
		if (audio !== null) {
			return { ...combo, audio };
		}
	}

	return null;
};

/**
 * compresses oversized videos and tone-maps HDR to SDR at any size.
 *
 * skips SDR within the limit, or HDR whose encoded output exceeds the limit while the source fits.
 *
 * @param blob the source video
 * @param onProgress called with progress from 0 to 1
 * @returns encoded video or a skipped outcome; callers must check the output size
 * @throws if reading or encoding fails, or an audio/video track is discarded
 */
export async function transcodeVideo(
	blob: Blob,
	onProgress: (progress: number) => void,
): Promise<TranscodeOutcome> {
	const input = new Input({ source: new BlobSource(blob), formats: INPUT_FORMATS });

	try {
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) {
			throw new Error('no video track');
		}

		// skip before measuring duration, which may scan the whole file.
		const oversized = blob.size > VIDEO_MAX_SIZE;

		// the service retags HDR as BT.709 without tone-mapping, causing washed-out playback.
		const isHdr = await videoTrack.hasHighDynamicRange();
		if (!oversized && !isHdr) {
			return { type: 'skipped', reason: 'within the size limit and not HDR' };
		}

		const [audioTrack, width, height, stats, metadataDuration] = await Promise.all([
			input.getPrimaryAudioTrack(),
			videoTrack.getDisplayWidth(),
			videoTrack.getDisplayHeight(),
			videoTrack.computePacketStats(STATS_PACKETS),
			input.getDurationFromMetadata(),
		]);

		const durationS = metadataDuration ?? (await input.computeDuration());
		const plan = planEncode({
			width,
			height,
			frameRate: stats.averagePacketRate,
			durationS,
			hasAudio: audioTrack !== null,
			sourceBitrate: Number.isFinite(stats.averageBitrate) ? Math.round(stats.averageBitrate) : null,
		});

		const combo = await pickCombo(plan, audioTrack);
		if (combo === null) {
			throw new Error('no encodable codec combination');
		}

		const { mimeType, createFormat } = CONTAINERS[combo.container];
		const target = createBlobTarget(mimeType);
		const output = new Output({ format: createFormat(), target: target.target });

		const conversion = await Conversion.init({
			input,
			output,
			video: {
				codec: combo.video,
				quality: new Quality({ bitrate: plan.videoBitrate }),
				width: plan.width,
				height: plan.height,
				fit: 'contain',
				keyFrameInterval: KEY_FRAME_INTERVAL,
				// bake in rotation because server re-encoding may drop rotation metadata.
				allowRotationMetadata: false,
				// force canvas rendering for HDR-to-SDR tone-mapping even without resizing.
				process: isHdr ? (sample) => sample : undefined,
			},
			audio:
				combo.audio !== null
					? { codec: combo.audio, quality: new Quality({ bitrate: plan.audioBitrate }) }
					: undefined,
		});

		if (!conversion.isValid) {
			throw new Error('conversion is not valid');
		}

		// isValid allows dropped tracks; reject them to preserve audio and video.
		for (const { track, reason } of conversion.discardedTracks) {
			if (track.type === 'video' || track.type === 'audio') {
				throw new Error(`${track.type} track discarded: ${reason}`);
			}
		}

		conversion.onProgress = onProgress;
		await conversion.execute();

		const encoded = target.read();
		// keep the original if tone-mapping pushed it over the limit.
		if (!oversized && encoded.size > VIDEO_MAX_SIZE) {
			return { type: 'skipped', reason: `the encode overshot the size limit at ${encoded.size} bytes` };
		}

		return {
			type: 'done',
			asset: {
				kind: 'video',
				blob: encoded,
				mimeType,
				width: plan.width,
				height: plan.height,
				duration: Math.round(durationS * 1000),
			},
		};
	} finally {
		input.dispose();
	}
}
