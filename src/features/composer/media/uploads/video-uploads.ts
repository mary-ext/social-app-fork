import type { Blob as AtpBlob } from '@atcute/lexicons';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { abortReason } from '#/lib/utils/abort-error';

import { m } from '#/paraglide/messages';

/** a processed video, ready to embed. */
export type UploadedVideo = {
	blob: AtpBlob;
	/** pixel width; 0 if unknown. */
	width: number;
	/** pixel height; 0 if unknown. */
	height: number;
};

export type UploadStep = 'compressing' | 'uploading' | 'processing';

export type PendingUpload = {
	status: UploadStep;
	/** overall progress, from 0 to 1. */
	progress: number;
	/** current step's progress, from 0 to 1. */
	stepProgress: number;
};

/** a video attachment's upload state. */
export type VideoUploadState =
	| PendingUpload
	| { status: 'done' }
	| {
			status: 'failed';
			/** user-facing message. */
			error: string;
			/** the video service's job, if processing started. */
			jobId: string | null;
	  };

/**
 * checks whether an upload is still running.
 *
 * @param state the upload's state
 * @returns whether it's compressing, uploading or processing
 */
export const isPendingUpload = (state: VideoUploadState | undefined): state is PendingUpload => {
	switch (state?.status) {
		case 'compressing':
		case 'processing':
		case 'uploading': {
			return true;
		}
		default: {
			return false;
		}
	}
};

/** an upload failure with a message for the user. */
export class VideoUploadError extends Error {
	/**
	 * @param message user-facing message
	 * @param jobId the video service's job, if processing started
	 */
	constructor(
		message: string,
		readonly jobId: string | null = null,
	) {
		super(message);
	}
}

/**
 * prepares and uploads one file, reporting progress until processing completes.
 *
 * @param file the attachment's file
 * @param options.setState receives unfinished states only
 * @param options.signal cancels the upload
 * @returns the processed video
 * @throws {VideoUploadError} if the upload fails
 * @throws the signal's abort reason if `signal` aborts
 */
export type ProcessVideoFile = (
	file: File,
	options: { setState: (state: PendingUpload) => void; signal: AbortSignal },
) => Promise<UploadedVideo>;

/** a composer's video uploads, keyed by file identity. */
export type VideoUploads = {
	/** subscribes to upload state changes. */
	subscribe: (listener: () => void) => () => void;
	/**
	 * reads a file's upload.
	 *
	 * @param file the attachment's file
	 * @returns the upload's state, or undefined if it isn't tracked
	 */
	getState: (file: File) => VideoUploadState | undefined;
	/**
	 * reads the files whose upload failed.
	 *
	 * @returns the failed files; identity is stable until membership changes
	 */
	getFailed: () => ReadonlySet<File>;
	/**
	 * restarts a failed upload; ignores other states and untracked files.
	 *
	 * @param file the attachment's file
	 */
	retry: (file: File) => void;
	/**
	 * waits for a file's upload to finish.
	 *
	 * @param file the attachment's file
	 * @param signal stops waiting without cancelling the upload
	 * @returns the processed video
	 * @throws {Error} if the file isn't tracked
	 * @throws {VideoUploadError} if the upload fails
	 * @throws the signal's abort reason if `signal` aborts, or an abort error if the upload is cancelled
	 */
	wait: (file: File, signal: AbortSignal) => Promise<UploadedVideo>;
	/**
	 * activates tracking and starts uploads for the given files.
	 *
	 * @param files the attachments' files
	 * @returns a function that cancels unfinished uploads and stops tracking
	 */
	activate: (files: ReadonlySet<File>) => () => void;
	/**
	 * starts added files and cancels removed files. reuses completed uploads on undo; no-op while inactive.
	 *
	 * @param files the attachments' files
	 */
	sync: (files: ReadonlySet<File>) => void;
};

type Entry = {
	state: VideoUploadState;
	/** null for a cached result. */
	controller: AbortController | null;
	result: Promise<UploadedVideo>;
};

const DONE: VideoUploadState = { status: 'done' };
const NO_FAILURES: ReadonlySet<File> = new Set();

/**
 * converts a fraction to a percentage.
 *
 * @param fraction a value from 0 to 1
 * @returns the percentage rounded to the nearest integer
 */
export const toPercent = (fraction: number): number => Math.round(fraction * 100);

// notify subscribers only when visible percentages or the stage change.
const isSameReport = (prev: PendingUpload, next: PendingUpload): boolean => {
	return (
		prev.status === next.status &&
		toPercent(prev.progress) === toPercent(next.progress) &&
		toPercent(prev.stepProgress) === toPercent(next.stepProgress)
	);
};

/**
 * creates an inactive upload tracker.
 *
 * @param process uploads one file
 * @returns the tracker
 */
export const createVideoUploads = (process: ProcessVideoFile): VideoUploads => {
	const emitter = new SimpleEventEmitter<[]>();
	const entries = new Map<File, Entry>();
	const finished = new WeakMap<File, UploadedVideo>();

	let failed = NO_FAILURES;
	let active = false;

	const refreshFailed = () => {
		const next = new Set<File>();
		for (const [file, entry] of entries) {
			if (entry.state.status === 'failed') {
				next.add(file);
			}
		}

		if (next.size !== failed.size || [...next].some((file) => !failed.has(file))) {
			failed = next.size > 0 ? next : NO_FAILURES;
		}
	};

	const start = (file: File) => {
		const done = finished.get(file);
		if (done) {
			entries.set(file, { state: DONE, controller: null, result: Promise.resolve(done) });
			return;
		}

		const { promise, resolve, reject } = Promise.withResolvers<UploadedVideo>();
		// uploads can fail before publishing attaches a rejection handler.
		promise.catch(() => {});

		const controller = new AbortController();
		const { signal } = controller;
		const entry: Entry = {
			state: { status: 'compressing', progress: 0, stepProgress: 0 },
			controller,
			result: promise,
		};
		entries.set(file, entry);

		const setState = (state: PendingUpload) => {
			// late progress reports must not reopen a finished or failed upload.
			if (signal.aborted || !isPendingUpload(entry.state) || isSameReport(entry.state, state)) {
				return;
			}

			entry.state = state;
			emitter.emit();
		};

		process(file, { setState, signal }).then(
			(video) => {
				if (signal.aborted) {
					reject(abortReason(signal));
					return;
				}

				finished.set(file, video);
				entry.state = DONE;
				emitter.emit();
				resolve(video);
			},
			(err: unknown) => {
				if (signal.aborted) {
					reject(abortReason(signal));
					return;
				}

				const error =
					err instanceof VideoUploadError
						? err
						: new VideoUploadError(m['features.composer.media.video.error.processFailed']());
				entry.state = { status: 'failed', error: error.message, jobId: error.jobId };
				refreshFailed();
				emitter.emit();
				reject(error);
			},
		);
	};

	const sync: VideoUploads['sync'] = (files) => {
		if (!active) {
			return;
		}

		let changed = false;

		for (const [file, entry] of entries) {
			if (!files.has(file)) {
				entry.controller?.abort();
				entries.delete(file);
				changed = true;
			}
		}
		for (const file of files) {
			if (!entries.has(file)) {
				start(file);
				changed = true;
			}
		}

		if (changed) {
			refreshFailed();
			emitter.emit();
		}
	};

	return {
		subscribe(listener) {
			return emitter.subscribe(listener);
		},
		getState(file) {
			return entries.get(file)?.state;
		},
		getFailed() {
			return failed;
		},
		retry(file) {
			if (entries.get(file)?.state.status !== 'failed') {
				return;
			}

			start(file);
			refreshFailed();
			emitter.emit();
		},
		wait(file, signal) {
			const entry = entries.get(file);
			if (!entry) {
				return Promise.reject(new Error(`attachment isn't being uploaded`));
			}
			if (signal.aborted) {
				return Promise.reject(abortReason(signal));
			}

			const { promise, resolve, reject } = Promise.withResolvers<UploadedVideo>();
			const onAbort = () => reject(abortReason(signal));
			signal.addEventListener('abort', onAbort, { once: true });
			entry.result.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));

			return promise;
		},
		activate(files) {
			active = true;
			sync(files);

			return () => {
				active = false;
				for (const entry of entries.values()) {
					entry.controller?.abort();
				}
				entries.clear();
				failed = NO_FAILURES;
				emitter.emit();
			};
		},
		sync,
	};
};
