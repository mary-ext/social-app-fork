import { abortReason } from '#/lib/utils/abort-error';

import type { MainToWorker, WorkerToMain } from './protocol';

export type GifTranscode = {
	blob: Blob;
	/** duration in milliseconds */
	duration: number;
};

type TranscodeOptions = {
	blob: Blob;
	setProgress: (progress: number) => void;
	signal: AbortSignal;
};

/**
 * checks for the browser APIs needed to transcode GIFs.
 *
 * @returns whether the APIs exist; codec support is checked separately for each GIF
 */
export function canTranscodeGif(): boolean {
	return typeof ImageDecoder !== 'undefined' && typeof VideoEncoder !== 'undefined';
}

/**
 * re-encodes an animated GIF as WebM to cut upload size.
 *
 * call {@link canTranscodeGif} first. upload the original GIF if this returns `undefined`.
 *
 * @param options source GIF, progress callback (0–1), and cancellation signal
 * @returns a smaller WebM, or `undefined` on worker error or no size reduction
 * @throws the signal's abort reason if `signal` aborts
 * @throws if the worker cannot be created
 */
export async function transcodeGifToWebm({
	blob,
	setProgress,
	signal,
}: TranscodeOptions): Promise<GifTranscode | undefined> {
	signal.throwIfAborted();

	const worker = new Worker(new URL('./transcode-worker.ts', import.meta.url), {
		type: 'module',
		name: 'gif-transcode-worker',
	});

	let onAbort: (() => void) | undefined;

	let result: GifTranscode | undefined;
	try {
		result = await new Promise<GifTranscode | undefined>((resolve, reject) => {
			// worker termination in finally discards partial output on abort.
			onAbort = () => {
				reject(abortReason(signal));
			};

			signal.addEventListener('abort', onAbort, { once: true });

			worker.addEventListener('message', (event: MessageEvent<WorkerToMain>) => {
				const message = event.data;
				switch (message.type) {
					case 'progress': {
						setProgress(message.progress);
						break;
					}
					case 'done': {
						resolve({ blob: message.blob, duration: message.durationMs });
						break;
					}
					case 'error': {
						console.error('Failed to transcode GIF', message.message);
						resolve(undefined);
						break;
					}
				}
			});

			worker.addEventListener('error', (event) => {
				console.error('GIF transcode worker failed', event.message);
				resolve(undefined);
			});

			const request: MainToWorker = { type: 'transcode', blob };
			worker.postMessage(request, []);
		});
	} finally {
		if (onAbort) {
			signal.removeEventListener('abort', onAbort);
		}
		worker.terminate();
	}

	if (result && result.blob.size >= blob.size) {
		console.warn(`Discarding GIF transcode, ${result.blob.size} bytes is no better than ${blob.size}`);
		return undefined;
	}

	return result;
}
