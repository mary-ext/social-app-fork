import type { VideoAssetKind } from '#/lib/media/video/types';
import { abortReason } from '#/lib/utils/abort-error';

import type { MainToWorker, TranscodedAsset, WorkerToMain } from './protocol';

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
	signal.throwIfAborted();

	const worker = new Worker(new URL('./transcode-worker.ts', import.meta.url), {
		type: 'module',
		name: 'media-transcode-worker',
	});
	const teardown = new AbortController();

	try {
		return await new Promise<TranscodedAsset | undefined>((resolve, reject) => {
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
						case 'done': {
							resolve(message.asset);
							break;
						}
						case 'skipped': {
							console.info(`Skipping transcode, ${message.reason}`);
							resolve(undefined);
							break;
						}
						case 'error': {
							console.error('Failed to transcode media', message.message);
							resolve(undefined);
							break;
						}
					}
				},
				{ signal: teardown.signal },
			);

			worker.addEventListener(
				'error',
				(event) => {
					console.error('Transcode worker failed', event.message);
					resolve(undefined);
				},
				{ signal: teardown.signal },
			);

			const request: MainToWorker = { kind, blob };
			worker.postMessage(request, []);
		});
	} finally {
		teardown.abort();
		worker.terminate();
	}
}
