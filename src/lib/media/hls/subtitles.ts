import { limitConcurrency } from '#/lib/utils/task';

import { fetchTextWithRetry, MAX_ATTEMPTS } from './fetch-policy';

// avoid crowding out video segment requests.
const MAX_CONCURRENT_SEGMENTS = 4;

export type SubtitleTrack = {
	/** rendition playlist url. */
	id: string;
	/** display label. */
	label: string;
	/** language code, or an empty string. */
	language: string;
	/** populated DOM text track. */
	track: TextTrack;
};

// #region m3u8

const parseAttributes = (line: string) => {
	const attributes = new Map<string, string>();
	// quoted values can contain commas.
	for (const [, key, value] of line.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
		attributes.set(key!, value!.startsWith('"') ? value!.slice(1, -1) : value!);
	}
	return attributes;
};

const isTagLine = (line: string) => line.startsWith('#');

const parseSegments = (playlist: string, base: string) =>
	playlist
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !isTagLine(line))
		.map((line) => new URL(line, base).href);

// #endregion

// #region webvtt

const parseTimestamp = (stamp: string) => {
	return stamp.split(':').reduce((total, part) => total * 60 + Number(part), 0);
};

const readTimestampMap = (block: string) => {
	const header = /X-TIMESTAMP-MAP=(.*)/.exec(block);
	if (!header) {
		return null;
	}
	let mpegts = 0;
	let local = 0;
	for (const field of header[1]!.split(',')) {
		const separator = field.indexOf(':');
		const name = field.slice(0, separator).trim();
		const value = field.slice(separator + 1).trim();
		switch (name) {
			case 'MPEGTS': {
				mpegts = Number(value) / 90_000;
				break;
			}
			case 'LOCAL': {
				local = parseTimestamp(value);
				break;
			}
		}
	}
	return mpegts - local;
};

const BLANK_LINE = /\r?\n\r?\n/;

const ALIGNMENTS = ['start', 'center', 'end', 'left', 'right'] as const;

const parsePercentage = (value: string) => Number(value.endsWith('%') ? value.slice(0, -1) : value);

// video controls set `line` to avoid covering cues.
const applySetting = (cue: VTTCue, setting: string) => {
	const separator = setting.indexOf(':');
	const value = setting.slice(separator + 1);
	switch (setting.slice(0, separator)) {
		case 'align': {
			const alignment = ALIGNMENTS.find((candidate) => candidate === value);
			if (alignment) {
				cue.align = alignment;
			}
			break;
		}
		case 'position': {
			cue.position = parsePercentage(value);
			break;
		}
		case 'size': {
			cue.size = parsePercentage(value);
			break;
		}
	}
};

const parseCues = (blocks: string[], offset: number) => {
	const cues: VTTCue[] = [];
	for (const block of blocks) {
		const lines = block.split(/\r?\n/).filter((line) => line.length > 0);
		const timing = lines.findIndex((line) => line.includes('-->'));
		if (timing < 0) {
			continue;
		}
		const [start, , end, ...settings] = lines[timing]!.trim().split(/\s+/);
		const text = lines.slice(timing + 1).join('\n');
		if (!start || !end || text.length === 0) {
			continue;
		}
		const cue = new VTTCue(parseTimestamp(start) + offset, parseTimestamp(end) + offset, text);
		for (const setting of settings) {
			applySetting(cue, setting);
		}
		cues.push(cue);
	}
	return cues;
};

// #endregion

// text tracks cannot be removed, so reuse them by rendition position.
const claimTracks = (video: HTMLVideoElement, wanted: { label: string; language: string }[]) => {
	const existing = [...video.textTracks].filter((track) => track.kind === 'subtitles');
	return wanted.map(({ label, language }, index) => {
		const reused = existing[index];
		if (!reused || reused.label !== label || reused.language !== language) {
			return video.addTextTrack('subtitles', label, language);
		}
		// remove from the end because the live list reindexes.
		const cues = reused.cues;
		for (let i = (cues?.length ?? 0) - 1; i >= 0; i--) {
			reused.removeCue(cues![i]!);
		}
		return reused;
	});
};

/**
 * loads HLS subtitle renditions onto a video element.
 *
 * @param video target video element
 * @param masterUrl master playlist url
 * @param signal abort signal
 * @returns loaded subtitle tracks
 * @throws when the master playlist cannot be fetched
 */
export const loadSubtitles = async (
	video: HTMLVideoElement,
	masterUrl: string,
	signal: AbortSignal,
): Promise<SubtitleTrack[]> => {
	const master = await fetchTextWithRetry(masterUrl, { attempts: MAX_ATTEMPTS.master, signal });
	const renditions = master
		.split('\n')
		.filter((line) => line.startsWith('#EXT-X-MEDIA:'))
		.map(parseAttributes)
		.filter((attributes) => attributes.get('TYPE') === 'SUBTITLES' && attributes.has('URI'))
		.map((attributes) => ({
			label: attributes.get('NAME') ?? 'subtitles',
			language: attributes.get('LANGUAGE') ?? '',
			playlistUrl: new URL(attributes.get('URI')!, masterUrl).href,
		}));
	const tracks = claimTracks(video, renditions);

	const loaded = await Promise.all(
		renditions.map(async ({ label, language, playlistUrl }, rendition) => {
			let segments: string[];
			try {
				segments = parseSegments(await fetchTextWithRetry(playlistUrl, { signal }), playlistUrl);
			} catch {
				// subtitle failures do not stop playback or other renditions.
				return null;
			}
			const fetchSegment = limitConcurrency(MAX_CONCURRENT_SEGMENTS, (segment: string) =>
				fetchTextWithRetry(segment, { signal }).catch(() => ''),
			);
			const documents = await Promise.all(segments.map(fetchSegment));
			if (signal.aborted) {
				return null;
			}
			// rebase each segment's MPEG-TS map to the first subtitle segment.
			const blocks = documents.map((vtt) => vtt.split(BLANK_LINE));
			const maps = blocks.map((segment) => readTimestampMap(segment[0] ?? ''));
			const base = maps.find((map) => map !== null) ?? 0;
			const track = tracks[rendition]!;
			track.mode = 'hidden';
			for (const [index, segment] of blocks.entries()) {
				for (const cue of parseCues(segment, (maps[index] ?? base) - base)) {
					track.addCue(cue);
				}
			}
			return { id: playlistUrl, label, language, track };
		}),
	);
	return loaded.filter((entry) => entry !== null);
};
