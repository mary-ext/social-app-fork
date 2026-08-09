import { BUFFER_AHEAD, type MainToWorker, type PlayerError, type WorkerToMain } from '../shared/protocol';
import { HttpError, isRetryable } from './fetch-policy';
import { createMp4InitSegment, createMp4MediaSegment, type MuxSample } from './mp4';
import { demuxMpegTs, MPEG_TS_TIMESCALE, type DemuxedMpegTs } from './mpeg-ts';
import { createFetcher, type Fetch } from './network';
import {
	parseSubtitleMaster,
	parseVideoMaster,
	parseVideoMedia,
	UnsupportedPlaylistError,
	type MediaPlaylist,
	type SubtitleRendition,
	type VideoVariant,
} from './playlist';
import { loadSubtitleCues } from './subtitles';

const PROGRESS_INTERVAL_MS = 1000;

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

let epoch = 0;
let currentIndex = 0;
let currentTime = 0;
let bufferAhead = BUFFER_AHEAD.background;
let durationReported = false;

let fetchResource: Fetch | undefined;
let activeRequest: AbortController | undefined;
let parked: (() => void)[] = [];

let subtitlesStarted = false;
let subtitleRequest: AbortController | undefined;

// #endregion

const wakeParked = () => {
	const waiting = parked;

	parked = [];
	for (const wake of waiting) {
		wake();
	}
};

const samplesFor = (content: DemuxedMpegTs, base: number) => {
	const video: MuxSample[] = content.video.map((sample, index, samples) => {
		const next = samples[index + 1];
		const previous = samples[index - 1];

		let duration = MPEG_TS_TIMESCALE / 30;
		if (next) {
			duration = next.dts - sample.dts;
		} else if (previous) {
			duration = sample.dts - previous.dts;
		}

		return {
			data: sample.data,
			dts: sample.dts - base,
			duration,
			key: sample.key,
			pts: sample.pts - base,
		};
	});
	const config = content.audioConfig;
	const audio: MuxSample[] = config
		? content.audio.map((sample, index, samples) => {
				const dts = Math.round(((sample.pts - base) * config.sampleRate) / MPEG_TS_TIMESCALE);
				const next = samples[index + 1];
				const duration = next
					? Math.round(((next.pts - sample.pts) * config.sampleRate) / MPEG_TS_TIMESCALE)
					: 1024;
				return { data: sample.data, dts, duration, key: true, pts: dts };
			})
		: [];

	return { audio, video };
};

// defer subtitles until playback starts.
const startSubtitles = (fetch: Fetch) => {
	const request = subtitleRequest;
	if (subtitlesStarted || !request || subtitleRenditions.length === 0) {
		return;
	}

	subtitlesStarted = true;
	loadSubtitleCues(subtitleRenditions, fetch, request.signal)
		.then((renditions) => {
			if (!request.signal.aborted && renditions.length > 0) {
				post({ type: 'subtitles', epoch, renditions });
			}
		})
		.catch((error: unknown) => {
			if (!request.signal.aborted) {
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

const streamFrom = async (index: number, startTime: number, myEpoch: number) => {
	currentIndex = index;
	currentTime = startTime;
	const variant = variants[index];
	if (!variant) {
		throw new Error(`no rendition at index ${index}`);
	}
	const fetch = fetchResource;
	if (!fetch) {
		throw new Error('rendition selected before the master playlist loaded');
	}

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

	const firstIndex = playlist.segments.findIndex((segment) => startTime < segment.start + segment.duration);
	if (firstIndex === -1) {
		post({ type: 'done', epoch: myEpoch });
		return;
	}

	let base: number | undefined;
	let initialized = false;
	let sequence = 1;
	for (const segment of playlist.segments.slice(firstIndex)) {
		while (segment.start > currentTime + bufferAhead) {
			await new Promise<void>((resolve) => parked.push(resolve));
			if (epoch !== myEpoch) {
				return;
			}
		}

		const resource = await fetch('media', segment.url, controller.signal);
		if (epoch !== myEpoch) {
			return;
		}

		const content = demuxMpegTs(resource.bytes);
		const firstVideo = content.video[0];
		if (!firstVideo) {
			throw new Error('MPEG-TS segment contains no video');
		}

		// align transport timestamps with the playlist.
		base ??= firstVideo.dts - Math.round(segment.start * MPEG_TS_TIMESCALE);
		const samples = samplesFor(content, base);

		if (!initialized) {
			const avc = content.avc;
			if (!avc) {
				throw new Error('H.264 segment contains no decoder configuration');
			}

			const codecs = [avc.codec];

			initialized = true;

			if (content.audioConfig) {
				codecs.push(`mp4a.40.${content.audioConfig.objectType}`);
			}

			post({ type: 'init', epoch: myEpoch, mimeType: `video/mp4; codecs="${codecs.join(',')}"` });
			postChunk(createMp4InitSegment(variant, avc, content.audioConfig), myEpoch);
		}
		postChunk(createMp4MediaSegment(sequence++, samples.video, samples.audio), myEpoch);
		startSubtitles(fetch);
	}
	post({ type: 'done', epoch: myEpoch });
};

const load = async (playlist: string, myEpoch: number) => {
	let lastProgress = 0;

	const controller = new AbortController();
	const fetch = createFetcher({
		onRetry: (failures) => post({ type: 'retrying', epoch, failures }),
		onBytes: () => {
			const now = performance.now();
			if (now - lastProgress < PROGRESS_INTERVAL_MS) {
				return;
			}
			lastProgress = now;
			post({ type: 'progress', epoch });
		},
	});

	durationReported = false;
	subtitlesStarted = false;
	playlists.clear();
	subtitleRequest?.abort();
	subtitleRequest = new AbortController();
	activeRequest = controller;
	fetchResource = fetch;

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
			subtitleRequest?.abort();
			subtitleRequest = undefined;
			fetchResource = undefined;
			variants = [];
			subtitleRenditions = [];
			subtitlesStarted = false;
			playlists.clear();
			bufferAhead = BUFFER_AHEAD.background;
			durationReported = false;
			break;
		}
		case 'select': {
			streamFrom(message.index, message.time, message.epoch).catch(report(message.epoch));
			break;
		}
		case 'seek': {
			streamFrom(currentIndex, message.time, message.epoch).catch(report(message.epoch));
			break;
		}
	}
});
