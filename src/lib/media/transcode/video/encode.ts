import {
	BlobSource,
	Conversion,
	Input,
	MATROSKA,
	MP4,
	MPEG_TS,
	Output,
	QTFF,
	Quality,
	WEBM,
} from 'mediabunny';

import { VIDEO_MAX_SIZE } from '#/lib/constants/video';

import { createBlobTarget } from '../blob-target';
import { pickCodecs } from '../codecs';
import { CONTAINERS } from '../containers';
import { KEY_FRAME_INTERVAL, planEncode } from '../plan';
import type { TranscodeOutcome } from '../protocol';

const INPUT_FORMATS = [MP4, QTFF, MATROSKA, WEBM, MPEG_TS];

// packet sample size for bitrate and frame rate estimates.
const STATS_PACKETS = 100;

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

		let audio = null;
		if (audioTrack !== null && (await audioTrack.canDecode())) {
			const [numberOfChannels, sampleRate] = await Promise.all([
				audioTrack.getNumberOfChannels(),
				audioTrack.getSampleRate(),
			]);
			audio = { numberOfChannels, sampleRate };
		}

		const combo = await pickCodecs(plan, audio);
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
