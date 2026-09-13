import { TranscodeError } from './errors';
import { transcodeGif } from './gif/encode';
import type { MainToWorker, TranscodeOutcome, WorkerToMain } from './protocol';
import { transcodeVideo } from './video/encode';
import { encodeVoiceClip } from './voice/encode';

declare const self: {
	postMessage: (message: WorkerToMain, transfer?: Transferable[]) => void;
	addEventListener: (type: 'message', listener: (event: MessageEvent<MainToWorker>) => void) => void;
};

// throttle per-packet progress to limit composer updates.
const PROGRESS_INTERVAL_MS = 150;

const post = (message: WorkerToMain) => {
	// the transfer list distinguishes this from `window.postMessage` for the linter.
	self.postMessage(message, []);
};

let lastProgressAt = 0;

const onProgress = (progress: number) => {
	const now = performance.now();
	if (progress < 1 && now - lastProgressAt < PROGRESS_INTERVAL_MS) {
		return;
	}
	lastProgressAt = now;
	post({ type: 'progress', progress });
};

const run = (request: MainToWorker): Promise<TranscodeOutcome> => {
	switch (request.type) {
		case 'gif': {
			return transcodeGif(request.blob, onProgress);
		}
		case 'video': {
			return transcodeVideo(request.blob, onProgress);
		}
		case 'voice': {
			return encodeVoiceClip(request, onProgress, (color) => {
				post({ type: 'voiceBackground', color });
			});
		}
	}
};

self.addEventListener('message', (event) => {
	void run(event.data).then(post, (err: unknown) => {
		post({
			type: 'error',
			code: err instanceof TranscodeError ? err.code : 'unknown',
			message: err instanceof Error ? err.message : String(err),
		});
	});
});
