import type { PlayerError } from '../shared/protocol';
import { canPlayMimeType } from './media-source';
import type { BufferedRange } from './playhead';

const BACK_BUFFER = 10;
// keep eviction beyond the worker's read-ahead boundary.
const FORWARD_SLACK = 20;
const MIN_EVICTION = 2;
// retain short loops to avoid refetching on each replay.
const LOOP_RETAIN_MAX = 60;

const PANIC_BUFFER = { back: 2, forward: 8, minimum: 0 };
const MAX_PANICS = 2;

type BufferWindow = { back: number; forward: number; minimum: number };

type Operation =
	| { type: 'append'; data: Uint8Array<ArrayBuffer> }
	| { type: 'changeType'; mimeType: string }
	| { type: 'duration'; duration: number }
	| ({ type: 'evict' } & BufferWindow)
	| { type: 'end' };

/**
 * serializes MediaSource and SourceBuffer updates.
 *
 * @param options.mediaSource media source to update
 * @param options.video video element playing the media source
 * @param options.signal removes listeners and stops queued updates when aborted
 * @param options.fail receives fatal errors; never called during construction
 * @returns buffer controls
 */
export const createMediaBuffer = ({
	mediaSource,
	video,
	signal,
	fail,
}: {
	mediaSource: MediaSource;
	video: HTMLVideoElement;
	signal: AbortSignal;
	fail: (error: PlayerError) => void;
}) => {
	const queue: Operation[] = [];

	let sourceBuffer: SourceBuffer | undefined;
	let sourceMimeType: string | undefined;

	let attempted: { start: number; end: number } | undefined;
	let panics = 0;

	const ranges = () => {
		const result: BufferedRange[] = [];
		const buffered = sourceBuffer?.buffered;
		for (let i = 0; i < (buffered?.length ?? 0); i++) {
			result.push([buffered!.start(i), buffered!.end(i)]);
		}
		return result;
	};

	// compute one range at a time because each SourceBuffer operation changes `buffered`.
	const nextEviction = ({ back, forward, minimum }: BufferWindow) => {
		if (mediaSource.readyState !== 'open') {
			return null;
		}
		const time = video.currentTime;
		for (const [start, end] of ranges()) {
			const behind = Math.min(end, time - back);
			if (behind - start > minimum) {
				return { start, end: behind };
			}
			const ahead = Math.max(start, time + forward);
			if (end - ahead > minimum) {
				return { start: ahead, end };
			}
		}
		return null;
	};

	const pump = () => {
		if (signal.aborted || !sourceBuffer || sourceBuffer.updating) {
			return;
		}
		while (queue.length > 0) {
			const operation = queue[0]!;
			switch (operation.type) {
				case 'append': {
					try {
						sourceBuffer.appendBuffer(operation.data);
					} catch (error) {
						if (!(error instanceof DOMException) || error.name !== 'QuotaExceededError') {
							fail({ code: 'media', message: String(error), fatal: true });
							break;
						}

						// keep the chunk and retry after emergency eviction.
						if (panics >= MAX_PANICS || !nextEviction(PANIC_BUFFER)) {
							fail({
								code: 'media',
								message: 'SourceBuffer is full with nothing evictable',
								fatal: true,
							});
							break;
						}

						panics++;
						queue.unshift({ type: 'evict', ...PANIC_BUFFER });
						continue;
					}

					panics = 0;
					queue.shift();
					return;
				}
				case 'changeType': {
					try {
						sourceBuffer.changeType(operation.mimeType);
					} catch (error) {
						fail({ code: 'unsupported', message: String(error), fatal: true });
						return;
					}

					break;
				}
				case 'duration': {
					const buffered = sourceBuffer.buffered;
					const end = buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
					// MSE rejects durations shorter than buffered media.
					if (mediaSource.readyState === 'open' && operation.duration >= end) {
						try {
							mediaSource.duration = operation.duration;
						} catch (error) {
							console.warn('[hls] could not set duration', error);
						}
					}

					break;
				}
				case 'evict': {
					const range = nextEviction(operation);
					// MSE can keep a range that does not span a complete coded-frame group.
					if (!range || (range.start === attempted?.start && range.end === attempted.end)) {
						attempted = undefined;
						break;
					}

					attempted = range;
					try {
						sourceBuffer.remove(range.start, range.end);
					} catch (error) {
						fail({ code: 'media', message: String(error), fatal: true });
						return;
					}

					return;
				}
				case 'end': {
					if (mediaSource.readyState === 'open') {
						try {
							mediaSource.endOfStream();
						} catch (error) {
							fail({ code: 'media', message: String(error), fatal: true });
							return;
						}
					}

					break;
				}
			}
			queue.shift();
		}
	};

	const enqueue = (operation: Operation) => {
		queue.push(operation);
		pump();
	};

	return {
		/** @returns buffered ranges in seconds */
		ranges,
		/**
		 * prepares the SourceBuffer for media of a MIME type; the MediaSource must be open.
		 *
		 * @param mimeType MIME type of the following chunks
		 * @throws if creating the SourceBuffer fails
		 */
		configure(mimeType: string) {
			if (mimeType === sourceMimeType) {
				return;
			}

			if (sourceBuffer) {
				sourceMimeType = mimeType;
				enqueue({ type: 'changeType', mimeType });
				return;
			}

			if (!canPlayMimeType(mimeType)) {
				fail({ code: 'unsupported', message: `MediaSource cannot play ${mimeType}`, fatal: true });
				return;
			}

			sourceMimeType = mimeType;
			sourceBuffer = mediaSource.addSourceBuffer(mimeType);
			sourceBuffer.addEventListener('updateend', pump, { signal });
			sourceBuffer.addEventListener(
				'error',
				() => {
					fail({ code: 'media', message: 'SourceBuffer error', fatal: true });
				},
				{ signal },
			);
			pump();
		},
		/**
		 * queues a media chunk.
		 *
		 * @param data initialization or media segment bytes
		 */
		append(data: Uint8Array<ArrayBuffer>) {
			enqueue({ type: 'append', data });
		},
		/**
		 * queues a duration change; ignored if it would cut off buffered media.
		 *
		 * @param duration duration in seconds
		 */
		setDuration(duration: number) {
			enqueue({ type: 'duration', duration });
		},
		/** queues the end of the stream. */
		end() {
			enqueue({ type: 'end' });
		},
		/**
		 * queues eviction of media outside the retention window around the playhead.
		 *
		 * @param ahead worker read-ahead limit in seconds
		 */
		evict(ahead: number) {
			if (queue.some((operation) => operation.type === 'evict')) {
				return;
			}
			if (video.loop && video.duration <= LOOP_RETAIN_MAX) {
				return;
			}

			enqueue({ type: 'evict', back: BACK_BUFFER, forward: ahead + FORWARD_SLACK, minimum: MIN_EVICTION });
		},
		/** drops queued operations without interrupting an update in progress. */
		clear() {
			queue.length = 0;
		},
	};
};
