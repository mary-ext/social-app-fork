import type { MainToWorker } from '../shared/protocol';
import { MediaSourceClass } from './media-source';

// retain one worker to avoid repeated demuxer startup.
let spareWorker: Worker | undefined;

// global epochs keep stale replies from matching a new player.
let epochCounter = 0;

const createWorker = () => {
	return new Worker(new URL('../worker/remux-worker.ts', import.meta.url), {
		type: 'module',
		name: 'remux-worker',
	});
};

/** @returns a worker epoch unique across player instances */
export const allocateEpoch = () => ++epochCounter;

/**
 * acquires a spare or new remux worker.
 *
 * @returns a worker owned by the caller until released
 */
export const acquireWorker = () => {
	const spare = spareWorker;
	spareWorker = undefined;
	return spare ?? createWorker();
};

/**
 * returns a worker for reuse, terminating it if a spare is already kept.
 *
 * @param worker a stopped worker in a reusable state
 */
export const releaseWorker = (worker: Worker) => {
	if (spareWorker) {
		worker.terminate();
		return;
	}
	spareWorker = worker;
};

// #region warming

// bound deduplication state while scrolling.
const MAX_WARMED = 20;

const warmed = new Set<string>();

/**
 * prefetches the master and initial rendition playlists into the HTTP cache; ignores failures.
 *
 * @param playlist the master playlist url
 */
export const warmHlsPlaylist = (playlist: string) => {
	if (!MediaSourceClass || warmed.has(playlist)) {
		return;
	}
	if (warmed.size >= MAX_WARMED) {
		warmed.delete(warmed.values().next().value!);
	}

	warmed.add(playlist);
	spareWorker ??= createWorker();
	spareWorker.postMessage({ type: 'warm', playlist } satisfies MainToWorker, []);
};

// #endregion
