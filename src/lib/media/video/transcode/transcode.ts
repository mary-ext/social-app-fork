import { VIDEO_MAX_DURATION_MS } from '#/lib/constants/video';
import type { VideoAssetKind } from '#/lib/media/video/types';
import { abortReason } from '#/lib/utils/abort-error';

import type { MainToWorker, PcmAudio, TranscodedAsset, VoiceClipInput, WorkerToMain } from './protocol';

type WorkerResult = Exclude<WorkerToMain, { type: 'progress' }>;

type RunOptions = {
	request: MainToWorker;
	transfer: Transferable[];
	setProgress: (progress: number) => void;
	signal: AbortSignal;
};

const runWorker = async ({ request, transfer, setProgress, signal }: RunOptions): Promise<WorkerResult> => {
	signal.throwIfAborted();

	const worker = new Worker(new URL('./transcode-worker.ts', import.meta.url), {
		type: 'module',
		name: 'media-transcode-worker',
	});
	const teardown = new AbortController();

	try {
		return await new Promise<WorkerResult>((resolve, reject) => {
			// worker termination in finally discards partial output on abort.
			signal.addEventListener('abort', () => reject(abortReason(signal)), { signal: teardown.signal });

			worker.addEventListener(
				'message',
				(event: MessageEvent<WorkerToMain>) => {
					const message = event.data;
					if (message.type === 'progress') {
						setProgress(message.progress);
					} else {
						resolve(message);
					}
				},
				{ signal: teardown.signal },
			);

			worker.addEventListener(
				'error',
				(event) => {
					resolve({ type: 'error', message: event.message });
				},
				{ signal: teardown.signal },
			);

			worker.postMessage(request, transfer);
		});
	} finally {
		teardown.abort();
		worker.terminate();
	}
};

type TranscodeOptions = {
	kind: VideoAssetKind;
	blob: Blob;
	setProgress: (progress: number) => void;
	signal: AbortSignal;
};

/**
 * checks for the browser APIs needed to transcode the source.
 *
 * @param kind source attachment kind
 * @returns whether the APIs exist; codec support is checked separately for each source
 */
export function canTranscode(kind: VideoAssetKind): boolean {
	if (kind === 'gif') {
		return typeof ImageDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
	}
	return typeof VideoDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
}

/**
 * checks whether an oversized source is eligible for transcoding.
 *
 * @param kind source attachment kind
 * @returns whether the source is a video with the required browser APIs available
 */
export function canRescueOversized(kind: VideoAssetKind): boolean {
	// GIF decoding loads the entire source into memory, so retain its input size limit.
	return kind !== 'gif' && canTranscode(kind);
}

/**
 * compresses oversized videos, tone-maps HDR to SDR, and converts animated GIFs to WebM.
 *
 * call {@link canTranscode} first. on `undefined`, validate the original's size before uploading.
 *
 * @param options source kind and blob, progress callback (0–1), and cancellation signal
 * @returns the encoded asset, or `undefined` if encoding fails or is skipped
 * @throws the signal's abort reason if `signal` aborts
 * @throws if the worker cannot be created
 */
export async function transcodeForUpload({
	kind,
	blob,
	setProgress,
	signal,
}: TranscodeOptions): Promise<TranscodedAsset | undefined> {
	const result = await runWorker({ request: { type: kind, blob }, transfer: [], setProgress, signal });
	switch (result.type) {
		case 'done': {
			return result.asset;
		}
		case 'skipped': {
			console.info(`Skipping transcode, ${result.reason}`);
			return undefined;
		}
		case 'error': {
			console.error('Failed to transcode media', result.message);
			return undefined;
		}
	}
}

type VoiceClipOptions = VoiceClipInput & {
	setProgress: (progress: number) => void;
	signal: AbortSignal;
};

const MIN_SAMPLE_RATE = 8_000;
const MAX_SAMPLE_RATE = 384_000;

const assertPlayable = ({ channels, sampleRate }: PcmAudio): void => {
	if (!Number.isInteger(sampleRate) || sampleRate < MIN_SAMPLE_RATE || sampleRate > MAX_SAMPLE_RATE) {
		throw new RangeError(`unsupported sample rate ${sampleRate}`);
	}

	const [first, ...rest] = channels;
	if (!first || first.length === 0) {
		throw new RangeError('audio has no samples');
	}
	if (rest.some((channel) => channel.length !== first.length)) {
		throw new RangeError('audio channels differ in length');
	}
	if ((first.length / sampleRate) * 1000 > VIDEO_MAX_DURATION_MS) {
		throw new RangeError('audio exceeds the maximum video duration');
	}
};

/**
 * checks for the browser APIs needed to render a voice clip.
 *
 * @returns whether the APIs exist; codec support is checked when rendering
 */
export function canRenderVoiceClip(): boolean {
	return (
		typeof OffscreenCanvas !== 'undefined' &&
		typeof VideoEncoder !== 'undefined' &&
		typeof AudioEncoder !== 'undefined'
	);
}

/**
 * renders audio as an avatar video with a pulsing halo.
 *
 * transfers ownership of the audio buffers and avatar; the caller cannot reuse them.
 *
 * @param options clip input, progress callback (0–1), and cancellation signal
 * @returns the encoded asset
 * @throws {RangeError} before transfer for empty or unequal-length channels, duration over the upload limit,
 *   or a sample rate that is non-integer or outside 8–384 kHz
 * @throws the signal's abort reason if `signal` aborts
 * @throws if worker setup or encoding fails, including unsupported codecs
 */
export async function renderVoiceClip({
	setProgress,
	signal,
	...input
}: VoiceClipOptions): Promise<TranscodedAsset> {
	assertPlayable(input.audio);

	// channels may share a buffer, which can be transferred only once.
	const transfer = new Set<Transferable>([
		input.avatar,
		...input.audio.channels.map((channel) => channel.buffer),
	]);

	const result = await runWorker({
		request: { type: 'voice', ...input },
		transfer: [...transfer],
		setProgress,
		signal,
	});
	switch (result.type) {
		case 'done': {
			return result.asset;
		}
		case 'skipped': {
			throw new Error(`voice clip was skipped: ${result.reason}`);
		}
		case 'error': {
			throw new Error(`failed to render voice clip: ${result.message}`);
		}
	}
}
