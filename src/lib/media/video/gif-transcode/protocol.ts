export type MainToWorker = { type: 'transcode'; blob: Blob };

export type WorkerToMain =
	| { type: 'progress'; progress: number }
	| { type: 'done'; blob: Blob; durationMs: number }
	| { type: 'error'; message: string };
