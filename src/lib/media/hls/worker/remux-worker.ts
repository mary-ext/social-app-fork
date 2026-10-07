import { BUFFER_AHEAD, type MainToWorker, type WorkerToMain } from '../shared/protocol';
import { toPlayerError } from './errors';
import { createFetcher, createStreamer, type Fetch, type Stream } from './network';
import {
	parseSubtitleMaster,
	parseVideoMaster,
	parseVideoMedia,
	UnsupportedPlaylistError,
	type MediaPlaylist,
	type MediaSegment,
	type SubtitleRendition,
	type VideoVariant,
} from './playlist';
import { createRemuxer, type Timeline } from './remux';
import { streamSubtitleCues } from './subtitles';
import { fetchWarmed, warmPlaylist } from './warm';

const PROGRESS_INTERVAL_MS = 1000;
// avoid refetching segments whose buffered end falls short of the playlist duration.
const SEGMENT_LOOKUP_TOLERANCE = 0.25;

// use the worker-global interface instead of Window.
declare const self: {
	postMessage: (message: WorkerToMain, transfer?: Transferable[]) => void;
	addEventListener: (type: 'message', listener: (event: MessageEvent<MainToWorker>) => void) => void;
};

const post = (message: WorkerToMain, transfer: Transferable[] = []) => {
	self.postMessage(message, transfer);
};

// #region player state

type Session = {
	network: { fetch: Fetch; stream: Stream };
	variants: VideoVariant[];
	subtitles: SubtitleRendition[];
	playlists: Map<string, MediaPlaylist>;
	// renditions share a transport timeline; keep its offsets across seeks and quality switches.
	timeline?: Timeline;
	durationReported: boolean;
	subtitleRequest?: AbortController;
};

let session: Session | undefined;

let epoch = 0;
let currentIndex = 0;
let currentTime = 0;
let bufferAhead = BUFFER_AHEAD.background;

let activeRequest: AbortController | undefined;
let parked: (() => void)[] = [];

// #endregion

const endSession = () => {
	session?.subtitleRequest?.abort();
	session = undefined;
};

const wakeParked = () => {
	const waiting = parked;

	parked = [];
	for (const wake of waiting) {
		wake();
	}
};

const selectSubtitles = (id: string | null) => {
	if (!session) {
		return;
	}

	session.subtitleRequest?.abort();
	session.subtitleRequest = undefined;

	const rendition = session.subtitles.find((candidate) => candidate.url === id);
	if (!rendition) {
		return;
	}

	const controller = new AbortController();

	session.subtitleRequest = controller;
	streamSubtitleCues({
		rendition,
		fetchResource: session.network.fetch,
		signal: controller.signal,
		emit: (cues) => {
			if (cues.length > 0) {
				post({ type: 'cues', id: rendition.url, cues });
			}
		},
	}).catch((error: unknown) => {
		if (!controller.signal.aborted) {
			console.warn('[hls] subtitles unavailable', error);
		}
	});
};

const mediaPlaylist = async (current: Session, variant: VideoVariant, signal: AbortSignal) => {
	const cached = current.playlists.get(variant.url);
	if (cached) {
		return cached;
	}
	const parsed = parseVideoMedia(await fetchWarmed(current.network.fetch, 'media', variant.url, signal));

	current.playlists.set(variant.url, parsed);

	return parsed;
};

const streamFrom = async ({
	index,
	time,
	from,
	myEpoch,
}: {
	index: number;
	time: number;
	from: number;
	myEpoch: number;
}) => {
	currentIndex = index;
	currentTime = time;
	const current = session;
	if (!current) {
		throw new Error('rendition selected before the master playlist loaded');
	}
	const variant = current.variants[index];
	if (!variant) {
		throw new Error(`no rendition at index ${index}`);
	}

	const controller = new AbortController();
	const active = () => epoch === myEpoch;

	activeRequest = controller;
	const playlist = await mediaPlaylist(current, variant, controller.signal);
	if (!active()) {
		return;
	}
	if (!current.durationReported) {
		current.durationReported = true;
		post({ type: 'duration', epoch: myEpoch, duration: playlist.duration });
	}

	const firstIndex = playlist.segments.findIndex(
		(segment) =>
			from + Math.min(SEGMENT_LOOKUP_TOLERANCE, segment.duration / 2) < segment.start + segment.duration,
	);
	if (firstIndex === -1) {
		post({ type: 'done', epoch: myEpoch });
		return;
	}

	const remuxer = createRemuxer(variant, (proposed) => (current.timeline ??= proposed), {
		init: (mimeType) => post({ type: 'init', epoch: myEpoch, mimeType }),
		chunk: (data) => post({ type: 'chunk', epoch: myEpoch, data }, [data.buffer]),
	});

	const segments = playlist.segments.slice(firstIndex);
	const withinReadAhead = (segment: MediaSegment) => segment.start <= currentTime + bufferAhead;
	const request = (segment: MediaSegment) => current.network.stream(segment.url, controller.signal);
	// overlap request latency with the current transfer.
	const prefetch = (position: number) => {
		const next = segments[position + 1];
		return next && withinReadAhead(next) ? request(next) : undefined;
	};

	let prefetched: ReadableStream<Uint8Array> | undefined;
	for (const [position, segment] of segments.entries()) {
		let pending = prefetched;
		if (!pending) {
			while (!withinReadAhead(segment)) {
				await new Promise<void>((resolve) => parked.push(resolve));
				if (!active()) {
					return;
				}
			}

			pending = request(segment);
		}

		// avoid bandwidth contention during startup and recovery.
		prefetched = position > 0 ? prefetch(position) : undefined;

		const completed = await remuxer.remux(segment, pending, {
			// fragment only when playback is waiting; prefetched segments can be appended whole.
			progressive: position === 0 || segment.start <= currentTime,
			active,
		});
		if (!completed) {
			return;
		}

		if (position === 0) {
			prefetched = prefetch(position);
		}
	}
	post({ type: 'done', epoch: myEpoch });
};

const load = async (playlist: string, myEpoch: number) => {
	let lastProgress = 0;

	const controller = new AbortController();
	const hooks = {
		onRetry: () => post({ type: 'retrying', epoch }),
		onBytes: () => {
			const now = performance.now();
			if (now - lastProgress < PROGRESS_INTERVAL_MS) {
				return;
			}
			lastProgress = now;
			post({ type: 'progress', epoch });
		},
	};
	const fetch = createFetcher(hooks);

	endSession();
	activeRequest = controller;

	const current: Session = {
		network: { fetch, stream: createStreamer(hooks) },
		variants: [],
		subtitles: [],
		playlists: new Map(),
		durationReported: false,
	};
	session = current;

	const resource = await fetchWarmed(fetch, 'master', playlist, controller.signal);

	current.variants = parseVideoMaster(resource);
	current.subtitles = parseSubtitleMaster(resource);

	if (epoch !== myEpoch) {
		return;
	}
	if (current.variants.length === 0) {
		throw new UnsupportedPlaylistError('master playlist has no AVC rendition');
	}

	post({
		type: 'renditions',
		epoch: myEpoch,
		renditions: current.variants.map(({ index, height, bitrate, mimeType }) => ({
			index,
			height,
			bitrate,
			mimeType,
		})),
		subtitles: current.subtitles.map(({ url, label, language }) => ({ id: url, label, language })),
	});
};

const report = (myEpoch: number) => (error: unknown) => {
	if (epoch !== myEpoch || (error instanceof DOMException && error.name === 'AbortError')) {
		return;
	}

	post({ type: 'error', epoch: myEpoch, ...toPlayerError(error) });
};

self.addEventListener('message', (event) => {
	const message = event.data;

	switch (message.type) {
		case 'time': {
			currentTime = message.time;
			wakeParked();
			return;
		}
		case 'buffer': {
			bufferAhead = message.ahead;
			wakeParked();
			return;
		}
		case 'subtitle': {
			selectSubtitles(message.id);
			return;
		}
		case 'warm': {
			warmPlaylist(message.playlist).catch(() => {});
			return;
		}
	}

	activeRequest?.abort();
	epoch = message.epoch;
	wakeParked();

	switch (message.type) {
		case 'load': {
			load(message.playlist, message.epoch).catch(report(message.epoch));
			break;
		}
		case 'stop': {
			endSession();
			bufferAhead = BUFFER_AHEAD.background;
			break;
		}
		case 'select': {
			streamFrom({
				index: message.index,
				time: message.time,
				from: message.time,
				myEpoch: message.epoch,
			}).catch(report(message.epoch));
			break;
		}
		case 'seek': {
			streamFrom({
				index: currentIndex,
				time: message.time,
				from: message.from,
				myEpoch: message.epoch,
			}).catch(report(message.epoch));
			break;
		}
	}
});
