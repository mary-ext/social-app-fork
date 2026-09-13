import type { VideoAssetKind } from '#/lib/media/video/types';
import { abortReason } from '#/lib/utils/abort-error';

import { TranscodeError } from './errors';
import type { MainToWorker, TranscodedAsset, VoiceClipInput, WorkerToMain } from './protocol';

type WorkerResult = Exclude<WorkerToMain, { type: 'progress' | 'voiceBackground' }>;

type RunOptions = {
	request: MainToWorker;
	setProgress: (progress: number) => void;
	setVoiceBackground?: (color: string) => void;
	signal: AbortSignal;
};

const runWorker = async ({
	request,
	setProgress,
	setVoiceBackground,
	signal,
}: RunOptions): Promise<WorkerResult> => {
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
					switch (message.type) {
						case 'progress': {
							setProgress(message.progress);
							break;
						}
						case 'voiceBackground': {
							setVoiceBackground?.(message.color);
							break;
						}
						default: {
							resolve(message);
							break;
						}
					}
				},
				{ signal: teardown.signal },
			);

			worker.addEventListener(
				'error',
				(event) => {
					resolve({ type: 'error', code: 'unknown', message: event.message });
				},
				{ signal: teardown.signal },
			);

			worker.postMessage(request, []);
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
	const result = await runWorker({ request: { type: kind, blob }, setProgress, signal });
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
	/** receives the card's CSS background color once the avatar loads */
	setBackground: (color: string) => void;
	signal: AbortSignal;
};

/**
 * checks for the browser APIs needed to render a voice clip.
 *
 * @returns whether the APIs exist; codec support is checked when rendering
 */
export function canRenderVoiceClip(): boolean {
	return (
		typeof OffscreenCanvas !== 'undefined' &&
		typeof AudioDecoder !== 'undefined' &&
		typeof AudioEncoder !== 'undefined' &&
		typeof VideoEncoder !== 'undefined'
	);
}

/**
 * renders audio as an avatar video with a pulsing halo.
 *
 * uses the default avatar if the account's avatar is unavailable.
 *
 * @param options clip input, progress (0–1) and background callbacks, and cancellation signal
 * @returns the encoded asset
 * @throws the signal's abort reason if `signal` aborts
 * @throws {TranscodeError} on rendering failure, with a code identifying the cause
 * @throws if the worker cannot be created
 */
export async function renderVoiceClip({
	setProgress,
	setBackground,
	signal,
	...input
}: VoiceClipOptions): Promise<TranscodedAsset> {
	const result = await runWorker({
		request: { type: 'voice', ...input },
		setProgress,
		setVoiceBackground: setBackground,
		signal,
	});
	switch (result.type) {
		case 'done': {
			return result.asset;
		}
		case 'skipped': {
			throw new TranscodeError('unknown', `voice clip was skipped: ${result.reason}`);
		}
		case 'error': {
			throw new TranscodeError(result.code, `failed to render voice clip: ${result.message}`);
		}
	}
}
