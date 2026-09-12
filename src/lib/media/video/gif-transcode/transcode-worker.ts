import {
	BufferTarget,
	getFirstEncodableVideoCodec,
	Output,
	Quality,
	VideoSample,
	VideoSampleSource,
	WebMOutputFormat,
	type VideoCodec,
} from 'mediabunny';

import { VIDEO_MAX_SIZE } from '#/lib/constants/video';
import { CLAMPED_GIF_DELAY_US, readGifMetadata } from '#/lib/media/gif-metadata';
import { clamp } from '#/lib/utils/numbers';

import type { MainToWorker, WorkerToMain } from './protocol';

declare const self: {
	postMessage: (message: WorkerToMain, transfer?: Transferable[]) => void;
	addEventListener: (type: 'message', listener: (event: MessageEvent<MainToWorker>) => void) => void;
};

// prefer VP9 for GIFs' flat colours and hard edges; fall back to VP8.
const CODECS: VideoCodec[] = ['vp9', 'vp8'];

// ~3 Mbps at 1080p, adjusted for resolution and VP9 efficiency.
const REFERENCE_BITRATE = 3_000_000;
const REFERENCE_PIXELS = 1920 * 1080;
const VP9_EFFICIENCY = 0.6;

const MIN_BITRATE = 300_000;
const MAX_BITRATE = 4_000_000;

// reserve 10% of the upload limit for bitrate overshoot.
const SIZE_BUDGET = 0.9;

const PROGRESS_INTERVAL_MS = 150;

const post = (message: WorkerToMain, transfer: Transferable[] = []) => {
	self.postMessage(message, transfer);
};

/** scales bitrate by resolution, capped by the upload size budget. */
const targetBitrate = (width: number, height: number, durationUs: number): number => {
	const scaled = REFERENCE_BITRATE * Math.pow((width * height) / REFERENCE_PIXELS, 0.95) * VP9_EFFICIENCY;

	const durationS = durationUs / 1e6;
	const ceiling = durationS > 0 ? (VIDEO_MAX_SIZE * 8 * SIZE_BUDGET) / durationS : MAX_BITRATE;

	return Math.round(clamp(scaled, MIN_BITRATE, Math.min(MAX_BITRATE, ceiling)));
};

const transcode = async (blob: Blob) => {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const { durationUs } = readGifMetadata(bytes);
	const decoder = new ImageDecoder({ type: 'image/gif', data: bytes });

	let firstImage: VideoFrame | undefined;
	let output: Output<WebMOutputFormat, BufferTarget> | undefined;
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

		// an explicit bitrate selects VBR; quantizer mode can inflate dithered GIFs.
		const quality = new Quality({
			bitrate: targetBitrate(firstImage.displayWidth, firstImage.displayHeight, durationUs),
		});

		const codec = await getFirstEncodableVideoCodec(CODECS, {
			width: firstImage.displayWidth,
			height: firstImage.displayHeight,
			quality,
		});

		if (codec === null) {
			throw new Error('no encodable video codec');
		}

		output = new Output({ format: new WebMOutputFormat(), target: new BufferTarget() });
		// tolerate malformed GIFs that change frame dimensions.
		const source = new VideoSampleSource({ codec, quality, sizeChangeBehavior: 'contain' });

		output.addVideoTrack(source);
		await output.start();
		started = true;

		let timestampUs = 0;
		let lastProgressAt = 0;

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

			const now = performance.now();
			if (now - lastProgressAt >= PROGRESS_INTERVAL_MS || index === frameCount - 1) {
				lastProgressAt = now;
				post({ type: 'progress', progress: (index + 1) / frameCount });
			}
		}

		await output.finalize();
		started = false;

		const buffer = output.target.buffer;
		if (!buffer) {
			throw new Error('transcode produced no output');
		}

		// send a Blob to avoid copying the buffer during structured clone.
		post({ type: 'done', blob: new Blob([buffer], { type: 'video/webm' }), durationMs: timestampUs / 1000 });
	} finally {
		firstImage?.close();
		if (started) {
			await output?.cancel();
		}
		decoder.close();
	}
};

self.addEventListener('message', (event) => {
	void transcode(event.data.blob).catch((err: unknown) => {
		post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
	});
});
