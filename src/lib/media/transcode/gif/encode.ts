import { Output, Quality, VideoSample, VideoSampleSource } from 'mediabunny';

import { CLAMPED_GIF_DELAY_US, readGifMetadata } from '#/lib/media/gif-metadata';
import { clamp } from '#/lib/utils/numbers';

import { createBlobTarget } from '../blob-target';
import { pickCodecs } from '../codecs';
import { CONTAINERS } from '../containers';
import { bitrateBudget, KEY_FRAME_INTERVAL, MIN_VIDEO_BITRATE, roundToEven } from '../plan';
import type { TranscodeOutcome } from '../protocol';

const REFERENCE_BITRATE = 3_000_000;
const REFERENCE_PIXELS = 1920 * 1080;

const MAX_BITRATE = 4_000_000;

/** scales bitrate by resolution, capped by the upload size budget. */
const targetBitrate = (width: number, height: number, durationUs: number): number => {
	const scaled = REFERENCE_BITRATE * Math.pow((width * height) / REFERENCE_PIXELS, 0.95);
	const ceiling = Math.min(MAX_BITRATE, bitrateBudget(durationUs / 1e6));

	return Math.round(clamp(scaled, MIN_VIDEO_BITRATE, ceiling));
};

/**
 * compresses an animated GIF to MP4, falling back to WebM if AVC is unavailable.
 *
 * @param blob the source GIF
 * @param onProgress called with progress from 0 to 1
 * @returns the encoded video, or a skipped outcome if it is no smaller than the GIF
 * @throws if decoding or encoding fails
 */
export async function transcodeGif(
	blob: Blob,
	onProgress: (progress: number) => void,
): Promise<TranscodeOutcome> {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const { durationUs } = readGifMetadata(bytes);
	const decoder = new ImageDecoder({ type: 'image/gif', data: bytes });

	let firstImage: VideoFrame | undefined;
	let output: Output | undefined;
	let started = false;

	try {
		// frame count is provisional until decoding completes.
		await decoder.tracks.ready;
		await decoder.completed;

		const track = decoder.tracks.selectedTrack;
		if (!track || track.frameCount === 0) {
			throw new Error('GIF has no frames');
		}

		const { frameCount } = track;
		firstImage = (await decoder.decode({ frameIndex: 0 })).image;

		if (firstImage.displayWidth <= 0 || firstImage.displayHeight <= 0) {
			throw new Error('GIF decoded to an empty frame');
		}

		// AVC requires even dimensions.
		const width = roundToEven(firstImage.displayWidth);
		const height = roundToEven(firstImage.displayHeight);

		// avoid redrawing every frame unless resizing is needed.
		const needsResize = width !== firstImage.displayWidth || height !== firstImage.displayHeight;

		const videoBitrate = targetBitrate(width, height, durationUs);
		const combo = await pickCodecs({ width, height, videoBitrate }, null);
		if (combo === null) {
			throw new Error('no encodable video codec');
		}

		const { mimeType, createFormat } = CONTAINERS[combo.container];

		const target = createBlobTarget(mimeType);
		output = new Output({ format: createFormat(), target: target.target });

		const source = new VideoSampleSource({
			codec: combo.video,
			// an explicit bitrate selects VBR; quantizer mode can inflate dithered GIFs.
			quality: new Quality({ bitrate: videoBitrate }),
			keyFrameInterval: KEY_FRAME_INTERVAL,
			// tolerate malformed GIFs that change frame dimensions.
			sizeChangeBehavior: 'contain',
			transform: needsResize ? { width, height } : undefined,
		});

		output.addVideoTrack(source);
		await output.start();
		started = true;

		let timestampUs = 0;

		for (let index = 0; index < frameCount; index++) {
			// reuse frame 0; the decoder may return the same frame after it has been closed.
			const image = firstImage ?? (await decoder.decode({ frameIndex: index })).image;
			firstImage = undefined;

			const frameDurationUs = image.duration ?? CLAMPED_GIF_DELAY_US;
			const startUs = image.timestamp || timestampUs;

			// closing the sample also releases its frame.
			const sample = new VideoSample(image, { timestamp: startUs / 1e6, duration: frameDurationUs / 1e6 });
			try {
				await source.add(sample);
			} finally {
				sample.close();
			}

			timestampUs = startUs + frameDurationUs;
			onProgress((index + 1) / frameCount);
		}

		await output.finalize();
		started = false;

		const encoded = target.read();
		if (encoded.size >= blob.size) {
			return { type: 'skipped', reason: `${encoded.size} bytes is no better than ${blob.size}` };
		}

		return {
			type: 'done',
			asset: { blob: encoded, mimeType, width, height, duration: timestampUs / 1000 },
		};
	} finally {
		firstImage?.close();
		if (started) {
			await output?.cancel();
		}
		decoder.close();
	}
}
