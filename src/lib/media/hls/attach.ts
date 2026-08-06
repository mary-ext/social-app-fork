import {
	BUFFER_AHEAD,
	type MainToWorker,
	type PlayerError,
	type Rendition,
	type WorkerToMain,
} from './protocol';
import { loadSubtitles, type SubtitleTrack } from './subtitles';

declare const ManagedMediaSource: typeof MediaSource | undefined;

const pickMediaSource = () => {
	if (typeof ManagedMediaSource !== 'undefined') {
		return ManagedMediaSource;
	}
	if (typeof MediaSource !== 'undefined') {
		return MediaSource;
	}
	return undefined;
};

const MediaSourceClass = pickMediaSource();

/** @returns whether the browser supports the HLS player. */
export const isHlsPlayerSupported = () => MediaSourceClass !== undefined;

/**
 * checks whether Media Source Extensions accept a MIME type.
 *
 * @param mimeType MIME type to check
 * @returns whether the MIME type is supported
 */
const canPlayMimeType = (mimeType: string) => MediaSourceClass?.isTypeSupported(mimeType) ?? false;

// #region policy

const BACK_BUFFER = 10;
// keep eviction beyond the worker's read-ahead boundary.
const FORWARD_SLACK = 20;
const TIME_REPORT_MS = 1000;
const MIN_EVICTION = 2;
const PANIC_BUFFER = { back: 2, forward: 8, minimum: 0 };
const MAX_RECOVERIES = 2;
const RESTART_INTERVAL_MS = 1000;
const PROGRESS_AFTER_RECOVERY = 1;
const STALL_CHECK_MS = 2000;
const STALL_MARGIN = 0.5;
// avoid restarting a slow request that is still delivering data.
const STALL_SILENCE_MS = 6000;
const OPEN_TIMEOUT_MS = 15000;

// #endregion

// #region worker pool

// retain one worker to avoid repeated demuxer startup.
let spareWorker: Worker | undefined;

// global epochs keep stale replies from matching a new player.
let epochCounter = 0;

const acquireWorker = () => {
	const spare = spareWorker;
	spareWorker = undefined;
	return (
		spare ??
		new Worker(new URL('./remux-worker.ts', import.meta.url), {
			type: 'module',
			name: 'remux-worker',
		})
	);
};

const releaseWorker = (worker: Worker) => {
	if (spareWorker) {
		worker.terminate();
		return;
	}
	spareWorker = worker;
};

// #endregion

export type PlayerStatus = 'loading' | 'ok' | 'retrying' | 'stopped';

export type PlayerHandle = {
	/** switches quality at the current playback position. */
	select: (index: number) => void;
	/** sets the read-ahead limit in seconds. */
	setBufferAhead: (ahead: number) => void;
	/** registers a listener and emits loaded renditions. */
	onRenditions: (fn: (renditions: Rendition[], selected: number) => void) => void;
	/** registers a listener and emits loaded subtitles. */
	onSubtitles: (fn: (tracks: SubtitleTrack[]) => void) => void;
	/** registers an unrecoverable error listener. */
	onError: (fn: (error: PlayerError) => void) => void;
	/** registers a listener and emits the current status. */
	onStatus: (fn: (status: PlayerStatus) => void) => void;
	/** releases the player and its resources. */
	destroy: () => void;
};

type Operation =
	| { type: 'append'; data: ArrayBuffer }
	| { type: 'changeType'; mimeType: string }
	| { type: 'duration'; duration: number }
	| ({ type: 'evict' } & BufferWindow)
	| { type: 'end' };

type BufferWindow = { back: number; forward: number; minimum: number };

/**
 * attaches an HLS playlist to a video element.
 *
 * @param video video element to attach
 * @param playlist the master playlist url
 * @returns player controls and listeners
 * @throws when Media Source Extensions are unavailable
 */
export const attachHlsPlayer = (video: HTMLVideoElement, playlist: string): PlayerHandle => {
	if (!MediaSourceClass) {
		throw new Error('no MediaSource implementation');
	}

	const teardown = new AbortController();
	const signal = teardown.signal;

	const mediaSource = new MediaSourceClass();
	const objectUrl = URL.createObjectURL(mediaSource);

	// iOS Safari requires this before ManagedMediaSource can open.
	video.disableRemotePlayback = true;
	video.src = objectUrl;

	const worker = acquireWorker();

	const send = (message: MainToWorker) => worker.postMessage(message, []);
	const nextEpoch = () => (epoch = ++epochCounter);

	let sourceBuffer: SourceBuffer | undefined;
	let renditions: Rendition[] = [];
	let selectedRendition = -1;
	let onRenditions: ((r: Rendition[], selected: number) => void) | undefined;
	let onSubtitles: ((tracks: SubtitleTrack[]) => void) | undefined;
	let onError: ((error: PlayerError) => void) | undefined;
	let subtitles: SubtitleTrack[] | undefined;
	let epoch = epochCounter;
	let loaded = false;
	let recoveries = 0;
	let stopped = false;
	let destroyed = false;
	let requestedAhead = BUFFER_AHEAD.background;
	let sated = false;
	let status: PlayerStatus = 'loading';
	let onStatus: ((status: PlayerStatus) => void) | undefined;
	let forwardBuffer = BUFFER_AHEAD.background + FORWARD_SLACK;
	let lastTimeReport = 0;

	const setStatus = (next: PlayerStatus) => {
		if (status === next) {
			return;
		}
		status = next;
		onStatus?.(next);
	};
	let lastRestart = 0;
	let deferredRestart: ReturnType<typeof setTimeout> | undefined;
	let recoveredAt = 0;
	let attempted: { start: number; end: number } | undefined;
	let lastDelivery = performance.now();
	const attachedAt = performance.now();
	const queue: Operation[] = [];

	let opened = false;
	const openPromise = new Promise<void>((resolve) => {
		mediaSource.addEventListener(
			'sourceopen',
			() => {
				opened = true;
				resolve();
			},
			{ once: true, signal },
		);
	});

	const applyBufferAhead = () => {
		send({ type: 'buffer', ahead: sated ? 0 : requestedAhead });
	};

	// ManagedMediaSource uses these events to control fetching.
	mediaSource.addEventListener(
		'startstreaming',
		() => {
			sated = false;
			applyBufferAhead();
		},
		{ signal },
	);
	mediaSource.addEventListener(
		'endstreaming',
		() => {
			sated = true;
			applyBufferAhead();
		},
		{ signal },
	);

	const fail = (error: PlayerError) => {
		if (destroyed) {
			return;
		}
		stopped = true;
		clearTimeout(deferredRestart);
		// stop mediabunny's internal retry loop.
		loaded = false;
		queue.length = 0;
		send({ type: 'stop', epoch: nextEpoch() });
		setStatus('stopped');
		console.error('[hls]', error.code, error.message);
		onError?.(error);
	};

	// #region source buffer

	const bufferedRanges = () => {
		const ranges: [number, number][] = [];
		const buffered = sourceBuffer?.buffered;
		for (let i = 0; i < (buffered?.length ?? 0); i++) {
			ranges.push([buffered!.start(i), buffered!.end(i)]);
		}
		return ranges;
	};

	// compute one range at a time because each SourceBuffer operation changes `buffered`.
	const nextEviction = ({ back, forward, minimum }: BufferWindow) => {
		if (mediaSource.readyState !== 'open') {
			return null;
		}
		const time = video.currentTime;
		for (const [start, end] of bufferedRanges()) {
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
		if (destroyed || !sourceBuffer || sourceBuffer.updating) {
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
						if (!nextEviction(PANIC_BUFFER)) {
							fail({
								code: 'media',
								message: 'SourceBuffer is full with nothing evictable',
								fatal: true,
							});
							break;
						}
						queue.unshift({ type: 'evict', ...PANIC_BUFFER });
						continue;
					}
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

	const evict = () => {
		if (queue.some((operation) => operation.type === 'evict')) {
			return;
		}
		queue.push({ type: 'evict', back: BACK_BUFFER, forward: forwardBuffer, minimum: MIN_EVICTION });
		pump();
	};

	// #endregion

	// #region recovery

	const bufferedAhead = (time: number) => {
		const range = bufferedRanges().find(([start, end]) => time >= start && time <= end);
		return range ? range[1] - time : 0;
	};

	const restartAt = (time: number) => {
		const sinceRestart = performance.now() - lastRestart;
		if (sinceRestart < RESTART_INTERVAL_MS) {
			clearTimeout(deferredRestart);
			deferredRestart = setTimeout(() => restartAt(time), RESTART_INTERVAL_MS - sinceRestart);
			return false;
		}
		lastRestart = performance.now();
		// give the restarted request a new silence budget.
		lastDelivery = performance.now();
		recoveredAt = time;
		queue.length = 0;
		if (!loaded) {
			send({ type: 'load', epoch: nextEpoch(), playlist });
			return true;
		}
		send({ type: 'seek', epoch: nextEpoch(), time });
		return true;
	};

	const recover = (time: number, exhausted: PlayerError) => {
		if (stopped) {
			return;
		}
		if (recoveries >= MAX_RECOVERIES) {
			fail(exhausted);
			return;
		}
		// charge deferred restarts so repeated failures cannot bypass the budget.
		recoveries++;
		restartAt(time);
	};

	const onWaiting = () => {
		if (!opened) {
			if (!video.paused && performance.now() - attachedAt > OPEN_TIMEOUT_MS) {
				fail({
					code: 'media',
					message: `MediaSource stayed closed for ${OPEN_TIMEOUT_MS / 1000}s`,
					fatal: true,
				});
			}
			return;
		}
		const time = video.currentTime;
		if (bufferedAhead(time) > STALL_MARGIN || video.duration - time < STALL_MARGIN) {
			return;
		}
		// do not abort a slow request that is still delivering data.
		if (performance.now() - lastDelivery < STALL_SILENCE_MS) {
			return;
		}
		recover(time, {
			code: 'media',
			message: `nothing delivered for ${STALL_SILENCE_MS / 1000}s at ${time.toFixed(1)}s`,
			fatal: true,
		});
	};

	// detect silent stalls, including startup while the element is paused.
	const watchdog = setInterval(() => {
		if (video.readyState >= video.HAVE_FUTURE_DATA) {
			return;
		}
		onWaiting();
	}, STALL_CHECK_MS);

	// #endregion

	// Mediabunny needs a separate subtitle request; defer it to prioritize playback segments.
	let subtitlesStarted = false;
	const startSubtitles = () => {
		if (subtitlesStarted || destroyed) {
			return;
		}
		subtitlesStarted = true;
		loadSubtitles(video, playlist, signal)
			.then((tracks) => {
				if (destroyed) {
					return;
				}
				subtitles = tracks;
				onSubtitles?.(tracks);
			})
			.catch((error: unknown) => {
				if (!signal.aborted) {
					console.warn('[hls] subtitles unavailable', error);
				}
			});
	};

	const selectRendition = (index: number, time: number) => {
		selectedRendition = index;
		queue.length = 0;
		send({ type: 'select', epoch: nextEpoch(), index, time });
	};

	const handleMessage = async (message: WorkerToMain) => {
		if (message.epoch !== epoch) {
			return;
		}
		switch (message.type) {
			case 'renditions': {
				// only the main thread can check MediaSource codec support.
				renditions = message.renditions.filter((rendition) => canPlayMimeType(rendition.mimeType));
				if (renditions.length === 0) {
					fail({
						code: 'unsupported',
						message: `no playable rendition among ${message.renditions.length}`,
						fatal: true,
					});
					break;
				}
				loaded = true;
				await openPromise;
				if (message.epoch !== epoch || destroyed) {
					break;
				}
				const tallest = renditions.reduce((best, rendition) =>
					rendition.height > best.height ? rendition : best,
				);
				onRenditions?.(renditions, tallest.index);
				selectRendition(tallest.index, 0);
				break;
			}
			case 'duration': {
				queue.push({ type: 'duration', duration: message.duration });
				pump();
				break;
			}
			case 'init': {
				lastDelivery = performance.now();
				await openPromise;
				if (message.epoch !== epoch || destroyed) {
					break;
				}
				if (!sourceBuffer) {
					if (!canPlayMimeType(message.mimeType)) {
						fail({
							code: 'unsupported',
							message: `MediaSource cannot play ${message.mimeType}`,
							fatal: true,
						});
						break;
					}
					sourceBuffer = mediaSource.addSourceBuffer(message.mimeType);
					sourceBuffer.addEventListener('updateend', pump, { signal });
					sourceBuffer.addEventListener(
						'error',
						() => {
							fail({ code: 'media', message: 'SourceBuffer error', fatal: true });
						},
						{ signal },
					);
				} else {
					queue.push({ type: 'changeType', mimeType: message.mimeType });
				}
				pump();
				break;
			}
			case 'chunk': {
				lastDelivery = performance.now();
				setStatus('ok');
				queue.push({ type: 'append', data: message.data });
				pump();
				startSubtitles();
				break;
			}
			case 'retrying': {
				setStatus('retrying');
				break;
			}
			case 'progress': {
				lastDelivery = performance.now();
				break;
			}
			case 'done': {
				queue.push({ type: 'end' });
				pump();
				break;
			}
			case 'error': {
				if (message.fatal) {
					fail(message);
					break;
				}
				console.warn('[hls] recovering from', message.code, message.message);
				recover(video.currentTime, { ...message, fatal: true });
				break;
			}
		}
	};

	worker.addEventListener(
		'message',
		(event: MessageEvent<WorkerToMain>) => {
			void handleMessage(event.data);
		},
		{ signal },
	);
	const onWorkerBroken = (what: string) => () => {
		fail({ code: 'demux', message: `remux worker ${what}`, fatal: true });
	};
	worker.addEventListener('error', onWorkerBroken('failed'), { signal });
	worker.addEventListener('messageerror', onWorkerBroken('sent an undeserializable message'), { signal });

	const onTime = () => {
		const now = performance.now();
		if (now - lastTimeReport < TIME_REPORT_MS) {
			return;
		}
		lastTimeReport = now;
		send({ type: 'time', time: video.currentTime });
		// only playhead progress confirms that recovery succeeded.
		if (video.currentTime > recoveredAt + PROGRESS_AFTER_RECOVERY) {
			recoveries = 0;
		}
		evict();
	};
	video.addEventListener('timeupdate', onTime, { signal });
	video.addEventListener('waiting', onWaiting, { signal });

	// an explicit seek starts a new recovery budget.
	const onSeeking = () => {
		recoveries = 0;
		stopped = false;
		if (bufferedAhead(video.currentTime) > STALL_MARGIN) {
			setStatus('ok');
			return;
		}
		setStatus('loading');
		restartAt(video.currentTime);
	};
	video.addEventListener('seeking', onSeeking, { signal });

	send({ type: 'load', epoch: nextEpoch(), playlist });
	// overwrite the previous player's read-ahead limit.
	applyBufferAhead();

	return {
		onRenditions: (fn) => {
			onRenditions = fn;
			if (renditions.length > 0) {
				fn(renditions, selectedRendition);
			}
		},
		onSubtitles: (fn) => {
			onSubtitles = fn;
			if (subtitles) {
				fn(subtitles);
			}
		},
		onError: (fn) => {
			onError = fn;
		},
		onStatus: (fn) => {
			onStatus = fn;
			fn(status);
		},
		select: (index) => {
			selectRendition(index, video.currentTime);
		},
		setBufferAhead: (ahead) => {
			requestedAhead = ahead;
			forwardBuffer = ahead + FORWARD_SLACK;
			applyBufferAhead();
		},
		destroy: () => {
			if (destroyed) {
				return;
			}
			// invalidate in-flight work before releasing its resources.
			destroyed = true;
			stopped = true;
			nextEpoch();
			queue.length = 0;
			clearTimeout(deferredRestart);
			clearInterval(watchdog);
			onRenditions = onSubtitles = onError = onStatus = undefined;
			teardown.abort();
			for (const track of subtitles ?? []) {
				track.track.mode = 'disabled';
			}
			// do not reuse a worker that reported a fatal error.
			if (status === 'stopped') {
				worker.terminate();
			} else {
				send({ type: 'stop', epoch });
				releaseWorker(worker);
			}
			URL.revokeObjectURL(objectUrl);
			// revoking the URL does not detach an active MediaSource.
			video.removeAttribute('src');
			video.load();
		},
	};
};
