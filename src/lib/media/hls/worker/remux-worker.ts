import { BUFFER_AHEAD, type MainToWorker, type PlayerError, type WorkerToMain } from '../shared/protocol';
import { HttpError, isRetryable, StalledError } from './fetch-policy';
import { createFragmenter } from './fragmenter';
import { createMp4InitSegment, createMp4MediaSegment, type MuxSample } from './mp4';
import { createMpegTsDemuxer, MPEG_TS_TIMESCALE } from './mpeg-ts';
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
import { streamSubtitleCues } from './subtitles';

const PROGRESS_INTERVAL_MS = 1000;
// avoid refetching segments whose buffered end falls short of the playlist duration.
const SEGMENT_LOOKUP_TOLERANCE = 0.25;
const FRAGMENT_DURATION = MPEG_TS_TIMESCALE / 2;

// use the worker-global interface instead of Window.
declare const self: {
	postMessage: (message: WorkerToMain, transfer?: Transferable[]) => void;
	addEventListener: (type: 'message', listener: (event: MessageEvent<MainToWorker>) => void) => void;
};

const post = (message: WorkerToMain, transfer: Transferable[] = []) => {
	self.postMessage(message, transfer);
};

const postChunk = (data: Uint8Array<ArrayBuffer>, myEpoch: number) => {
	post({ type: 'chunk', epoch: myEpoch, data }, [data.buffer]);
};

// #region player state

let variants: VideoVariant[] = [];
let subtitleRenditions: SubtitleRendition[] = [];
const playlists = new Map<string, MediaPlaylist>();
// renditions share a transport timeline; keep its offsets across seeks and quality switches.
let timeline: { base: number; decodeBase: number } | undefined;

let epoch = 0;
let currentIndex = 0;
let currentTime = 0;
let bufferAhead = BUFFER_AHEAD.background;
let durationReported = false;

let network: { fetch: Fetch; stream: Stream } | undefined;
let activeRequest: AbortController | undefined;
let parked: (() => void)[] = [];

let subtitleRequest: AbortController | undefined;

// #endregion

const resetSession = () => {
	durationReported = false;
	playlists.clear();
	timeline = undefined;
	subtitleRequest?.abort();
	subtitleRequest = undefined;
};

const wakeParked = () => {
	const waiting = parked;

	parked = [];
	for (const wake of waiting) {
		wake();
	}
};

const selectSubtitles = (id: string | null) => {
	subtitleRequest?.abort();
	subtitleRequest = undefined;

	const rendition = subtitleRenditions.find((candidate) => candidate.url === id);
	const fetch = network?.fetch;
	if (!rendition || !fetch) {
		return;
	}

	const controller = new AbortController();

	subtitleRequest = controller;
	streamSubtitleCues({
		rendition,
		fetchResource: fetch,
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

const mediaPlaylist = async (variant: VideoVariant, fetch: Fetch, signal: AbortSignal) => {
	const cached = playlists.get(variant.url);
	if (cached) {
		return cached;
	}
	const parsed = parseVideoMedia(await fetch('media', variant.url, signal));

	playlists.set(variant.url, parsed);

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
	const variant = variants[index];
	if (!variant) {
		throw new Error(`no rendition at index ${index}`);
	}
	if (!network) {
		throw new Error('rendition selected before the master playlist loaded');
	}
	const { fetch, stream } = network;

	const controller = new AbortController();

	activeRequest = controller;
	const playlist = await mediaPlaylist(variant, fetch, controller.signal);
	if (epoch !== myEpoch) {
		return;
	}
	if (!durationReported) {
		durationReported = true;
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

	const segments = playlist.segments.slice(firstIndex);
	const withinReadAhead = (segment: MediaSegment) => segment.start <= currentTime + bufferAhead;
	const request = (segment: MediaSegment) => stream(segment.url, controller.signal);
	// overlap request latency with the current transfer.
	const prefetch = (position: number) => {
		const next = segments[position + 1];
		return next && withinReadAhead(next) ? request(next) : undefined;
	};
	let initialized = false;
	let sequence = 1;
	let prefetched: ReadableStream<Uint8Array> | undefined;
	for (const [position, segment] of segments.entries()) {
		let pending = prefetched;
		if (!pending) {
			while (!withinReadAhead(segment)) {
				await new Promise<void>((resolve) => parked.push(resolve));
				if (epoch !== myEpoch) {
					return;
				}
			}

			pending = request(segment);
		}

		// avoid bandwidth contention during startup and recovery.
		prefetched = position > 0 ? prefetch(position) : undefined;

		const demuxer = createMpegTsDemuxer();
		const fragmenter = createFragmenter();
		// fragment only when playback is waiting; prefetched segments can be appended whole.
		const progressive = position === 0 || segment.start <= currentTime;

		const initialize = () => {
			const avc = demuxer.avc;
			if (!avc) {
				throw new Error('H.264 segment contains no decoder configuration');
			}

			const audioConfig = demuxer.audioConfig;
			const codecs = [avc.codec];

			initialized = true;

			if (audioConfig) {
				codecs.push(`mp4a.40.${audioConfig.objectType}`);
			}

			post({ type: 'init', epoch: myEpoch, mimeType: `video/mp4; codecs="${codecs.join(',')}"` });
			postChunk(createMp4InitSegment(variant, avc, audioConfig), myEpoch);
		};
		// wait for declared audio so the init segment includes its track.
		const configured = () =>
			demuxer.avc !== undefined && (!variant.hasAudio || demuxer.audioConfig !== undefined);
		const timing = () => {
			if (!timeline) {
				const start = Math.round(segment.start * MPEG_TS_TIMESCALE);
				// anchor both timelines at the segment start without making B-frame DTS negative.
				timeline = {
					base: fragmenter.earliestPts - start,
					decodeBase: fragmenter.earliestDts - start,
				};
			}
			return { ...timeline, sampleRate: demuxer.audioConfig?.sampleRate };
		};
		const emit = ({ audio, video }: { audio: MuxSample[]; video: MuxSample[] }) => {
			if (video.length > 0) {
				postChunk(createMp4MediaSegment(sequence++, video, audio), myEpoch);
			}
		};

		for await (const chunk of pending) {
			if (epoch !== myEpoch) {
				return;
			}

			fragmenter.add(demuxer.push(chunk));
			if (!progressive || fragmenter.queuedDuration < FRAGMENT_DURATION) {
				continue;
			}
			if (!initialized) {
				if (!configured()) {
					continue;
				}
				initialize();
			}
			emit(fragmenter.take(timing()));
		}
		if (epoch !== myEpoch) {
			return;
		}

		fragmenter.add(demuxer.end());
		if (!initialized) {
			initialize();
		}
		emit(fragmenter.drain(timing()));

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

	resetSession();
	activeRequest = controller;
	network = { fetch, stream: createStreamer(hooks) };

	const resource = await fetch('master', playlist, controller.signal);

	variants = parseVideoMaster(resource);
	subtitleRenditions = parseSubtitleMaster(resource);

	if (epoch !== myEpoch) {
		return;
	}
	if (variants.length === 0) {
		throw new UnsupportedPlaylistError('master playlist has no AVC rendition');
	}

	post({
		type: 'renditions',
		epoch: myEpoch,
		renditions: variants.map(({ index, height, bitrate, mimeType }) => ({
			index,
			height,
			bitrate,
			mimeType,
		})),
		subtitles: subtitleRenditions.map(({ url, label, language }) => ({ id: url, label, language })),
	});
};

const toPlayerError = (error: unknown): PlayerError => {
	const message = error instanceof Error ? error.message : String(error);

	if (error instanceof UnsupportedPlaylistError) {
		return { code: 'unsupported', message, fatal: true };
	}

	if (error instanceof HttpError) {
		switch (error.status) {
			case 404:
			case 410: {
				return { code: 'not_found', message, fatal: true };
			}
			default: {
				return { code: 'network', message, fatal: !isRetryable(error.status) };
			}
		}
	}

	// don't repeat exhausted idle retries through client recovery.
	if (error instanceof StalledError) {
		return { code: 'network', message, fatal: true };
	}

	if (error instanceof TypeError) {
		return { code: 'network', message, fatal: false };
	}

	return { code: 'demux', message, fatal: true };
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
		// subtitle selection does not change the video epoch.
		case 'subtitle': {
			selectSubtitles(message.id);
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
			resetSession();
			network = undefined;
			variants = [];
			subtitleRenditions = [];
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
