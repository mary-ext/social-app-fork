import {
	BUFFER_AHEAD,
	pickRendition,
	type MainToWorker,
	type PlayerError,
	type Rendition,
	type WorkerToMain,
} from '../shared/protocol';
import { canPlayMimeType, MediaSourceClass } from './media-source';
import { bufferedRangeAt, isBufferedAt, isNearEnd, jumpGap } from './playhead';
import { createMediaBuffer } from './source-buffer';
import { createSubtitleController, type SubtitleTrack } from './subtitles';
import { acquireWorker, allocateEpoch, releaseWorker } from './worker-pool';

// #region policy

const MAX_RECOVERIES = 2;
const RESTART_INTERVAL_MS = { seek: 150, recovery: 1000 };
const PROGRESS_AFTER_RECOVERY = 1;

const STALL_CHECK_MS = 2000;
// let the worker's idle timeout trigger retries before restarting it.
const STALL_SILENCE_MS = 6000;

const NUDGE = { step: 0.1, attempts: 3 };

const TIME_REPORT_MS = 1000;
const OPEN_TIMEOUT_MS = 15000;

// #endregion

export type PlayerStatus = 'loading' | 'ok' | 'retrying' | 'stopped';

export type PlayerHandle = {
	/** switches quality at the current playback position. */
	select: (index: number) => void;
	/** sets the read-ahead limit in seconds. */
	setBufferAhead: (ahead: number) => void;
	/** registers a listener and emits loaded renditions. */
	onRenditions: (fn: (renditions: Rendition[], selected: number) => void) => void;
	/** registers a listener and emits available subtitle tracks. */
	onSubtitles: (fn: (tracks: SubtitleTrack[]) => void) => void;
	/** selects and loads a subtitle track, or disables subtitles with `null`. */
	selectSubtitle: (id: string | null) => void;
	/** sets the vertical position for subtitle cues. */
	setCueLine: (line: number) => void;
	/** registers an unrecoverable error listener. */
	onError: (fn: (error: PlayerError) => void) => void;
	/** registers a listener and emits the current status. */
	onStatus: (fn: (status: PlayerStatus) => void) => void;
	/** releases the player and its resources. */
	destroy: () => void;
};

/**
 * attaches an HLS playlist to a video element.
 *
 * @param video video element to attach
 * @param playlist the master playlist url
 * @param startTime initial playback position in seconds
 * @returns player controls and listeners
 * @throws when Media Source Extensions are unavailable
 */
export const attachHlsPlayer = (
	video: HTMLVideoElement,
	playlist: string,
	startTime: number,
): PlayerHandle => {
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
	// set after src resets playback; before metadata, currentTime stores the start position.
	video.currentTime = startTime;

	const worker = acquireWorker();
	const attachedAt = performance.now();

	const send = (message: MainToWorker) => worker.postMessage(message, []);
	const nextEpoch = () => (epoch = allocateEpoch());

	let epoch = 0;
	let loaded = false;
	let destroyed = false;

	let renditions: Rendition[] = [];
	let selectedRendition = -1;
	let onRenditions: ((r: Rendition[], selected: number) => void) | undefined;

	let onError: ((error: PlayerError) => void) | undefined;

	let status: PlayerStatus = 'loading';
	let onStatus: ((status: PlayerStatus) => void) | undefined;

	const setStatus = (next: PlayerStatus) => {
		if (status === next) {
			return;
		}
		status = next;
		onStatus?.(next);
	};

	let stopped = false;
	let recoveries = 0;
	let lastRestart = 0;
	let deferredRestart: ReturnType<typeof setTimeout> | undefined;
	let recoveredAt = 0;
	let lastDelivery = performance.now();
	let stuckAt: number | undefined;
	let nudges = 0;

	const fail = (error: PlayerError) => {
		if (destroyed) {
			return;
		}
		stopped = true;
		clearTimeout(deferredRestart);
		loaded = false;
		buffer.clear();
		send({ type: 'stop', epoch: nextEpoch() });
		setStatus('stopped');
		console.error('[hls]', error.code, error.message);
		onError?.(error);
	};

	const buffer = createMediaBuffer({ mediaSource, video, signal, fail });
	const subtitles = createSubtitleController(video, (id) => send({ type: 'subtitle', id }));

	// #region media source

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

	let requestedAhead = BUFFER_AHEAD.background;
	let sated = false;

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

	// #endregion

	// #region recovery

	const restartAt = (time: number, interval: number) => {
		const sinceRestart = performance.now() - lastRestart;
		if (sinceRestart < interval) {
			clearTimeout(deferredRestart);
			deferredRestart = setTimeout(() => restartAt(time, interval), interval - sinceRestart);
			return;
		}

		lastRestart = performance.now();
		// give the restarted request a new silence budget.
		lastDelivery = performance.now();
		recoveredAt = time;
		buffer.clear();

		if (!loaded) {
			send({ type: 'load', epoch: nextEpoch(), playlist });
			return;
		}

		const from = bufferedRangeAt(buffer.ranges(), time)?.[1] ?? time;
		send({ type: 'seek', epoch: nextEpoch(), time, from });
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
		restartAt(time, RESTART_INTERVAL_MS.recovery);
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

		const ranges = buffer.ranges();
		if (jumpGap(video, ranges)) {
			return;
		}

		const time = video.currentTime;
		if (isBufferedAt(video.duration, ranges, time) || isNearEnd(video.duration, time)) {
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

	// nudge a decoder stall after two checks without playhead progress.
	const nudgeStall = () => {
		const time = video.currentTime;
		const stuck =
			time === stuckAt &&
			!video.paused &&
			!video.seeking &&
			!video.ended &&
			!isNearEnd(video.duration, time) &&
			isBufferedAt(video.duration, buffer.ranges(), time);

		stuckAt = time;
		if (!stuck) {
			return false;
		}
		if (nudges >= NUDGE.attempts) {
			fail({
				code: 'media',
				message: `playback stuck at ${time.toFixed(1)}s with media buffered`,
				fatal: true,
			});
			return true;
		}

		nudges++;
		recoveredAt = time;
		video.currentTime = time + NUDGE.step * nudges;
		return true;
	};

	// detect silent stalls, including startup while the element is paused.
	const watchdog = setInterval(() => {
		if (video.readyState >= video.HAVE_FUTURE_DATA) {
			stuckAt = undefined;
			return;
		}
		if (nudgeStall()) {
			return;
		}

		onWaiting();
	}, STALL_CHECK_MS);

	// #endregion

	// #region worker messages

	const selectRendition = (index: number, time: number) => {
		selectedRendition = index;
		buffer.clear();
		send({ type: 'select', epoch: nextEpoch(), index, time });
	};

	const handleMessage = async (message: WorkerToMain) => {
		// subtitle streams use track IDs instead of video epochs.
		if (message.type === 'cues') {
			subtitles.addCues(message.id, message.cues);
			return;
		}
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
				subtitles.announce(message.subtitles);

				await openPromise;

				if (message.epoch !== epoch || destroyed) {
					break;
				}

				const preferred = pickRendition(renditions);

				onRenditions?.(renditions, preferred.index);
				selectRendition(preferred.index, video.currentTime);
				break;
			}
			case 'duration': {
				buffer.setDuration(message.duration);
				break;
			}
			case 'init': {
				lastDelivery = performance.now();
				await openPromise;

				if (message.epoch !== epoch || destroyed) {
					break;
				}

				buffer.configure(message.mimeType);
				break;
			}
			case 'chunk': {
				lastDelivery = performance.now();
				setStatus('ok');
				buffer.append(message.data);
				break;
			}
			case 'retrying': {
				// defer client recovery while the worker retries.
				lastDelivery = performance.now();
				// don't show a retry status while buffered playback continues.
				if (status !== 'ok') {
					setStatus('retrying');
				}

				break;
			}
			case 'progress': {
				lastDelivery = performance.now();
				break;
			}
			case 'done': {
				buffer.end();
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

	// #endregion

	// #region video events

	let lastTimeReport = 0;
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
			nudges = 0;
		}

		buffer.evict(requestedAhead);
	};
	video.addEventListener('timeupdate', onTime, { signal });
	video.addEventListener('waiting', onWaiting, { signal });

	// an explicit seek starts a new recovery budget.
	const onSeeking = () => {
		recoveries = 0;
		stopped = false;

		if (isBufferedAt(video.duration, buffer.ranges(), video.currentTime)) {
			setStatus('ok');
			return;
		}

		setStatus('loading');
		restartAt(video.currentTime, RESTART_INTERVAL_MS.seek);
	};
	video.addEventListener('seeking', onSeeking, { signal });

	// #endregion

	send({ type: 'load', epoch: nextEpoch(), playlist });
	// overwrite the previous player's read-ahead limit.
	applyBufferAhead();

	return {
		onRenditions(fn) {
			onRenditions = fn;

			if (renditions.length > 0) {
				fn(renditions, selectedRendition);
			}
		},
		onSubtitles(fn) {
			subtitles.onTracks(fn);
		},
		selectSubtitle(id) {
			subtitles.select(id);
		},
		setCueLine(line) {
			subtitles.setCueLine(line);
		},
		onError(fn) {
			onError = fn;
		},
		onStatus(fn) {
			onStatus = fn;

			fn(status);
		},
		select(index) {
			selectRendition(index, video.currentTime);
		},
		setBufferAhead(ahead) {
			requestedAhead = ahead;

			applyBufferAhead();
		},
		destroy() {
			if (destroyed) {
				return;
			}

			// invalidate in-flight work before releasing its resources.
			destroyed = true;
			stopped = true;
			nextEpoch();
			buffer.clear();
			clearTimeout(deferredRestart);
			clearInterval(watchdog);

			onRenditions = onError = onStatus = undefined;

			teardown.abort();
			subtitles.destroy();

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
