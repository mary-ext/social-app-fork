import { decodeUtf8From } from '@atcute/uint8array';

import { mapDefined } from '@mary/array-fns';

import type { Rendition } from '../shared/protocol';
import type { Resource } from './network';

export type VideoVariant = Rendition & { url: string; width: number };

type VideoSegment = {
	duration: number;
	start: number;
	url: string;
};

export type MediaPlaylist = {
	duration: number;
	segments: VideoSegment[];
};

export type SubtitleRendition = {
	label: string;
	language: string;
	url: string;
};

/** an unsupported HLS playlist. */
export class UnsupportedPlaylistError extends Error {}

const parseHlsAttributes = (line: string) => {
	const attributes = new Map<string, string>();

	// quoted values can contain commas.
	for (const [, key, value] of line.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
		attributes.set(key!, value!.startsWith('"') ? value!.slice(1, -1) : value!);
	}

	return attributes;
};

const linesOf = (text: string) => text.split(/\r?\n/).map((line) => line.trim());

// a playlist tag carries its uri on the next line that is neither blank nor another tag.
const uriAfter = (lines: string[], tag: number) => {
	for (let index = tag + 1; index < lines.length; index++) {
		const line = lines[index]!;
		if (line !== '' && !line.startsWith('#')) {
			return line;
		}
	}

	return undefined;
};

/**
 * parses supported video variants.
 *
 * @param resource master playlist
 * @returns variants in playlist order
 */
export const parseVideoMaster = (resource: Resource): VideoVariant[] => {
	const lines = linesOf(decodeUtf8From(resource.bytes));
	const variants: VideoVariant[] = [];

	for (const [lineIndex, line] of lines.entries()) {
		if (!line.startsWith('#EXT-X-STREAM-INF:')) {
			continue;
		}

		const attributes = parseHlsAttributes(line);
		const codecs = attributes.get('CODECS') ?? '';
		const supported = codecs.split(',').every((codec) => codec.startsWith('avc1.') || codec === 'mp4a.40.2');
		const resolution = attributes.get('RESOLUTION')?.split('x').map(Number);
		const uri = uriAfter(lines, lineIndex);

		if (!supported || !codecs.includes('avc1.') || !resolution || !uri) {
			continue;
		}

		variants.push({
			index: variants.length,
			bitrate: Number(attributes.get('BANDWIDTH')) || null,
			height: resolution[1]!,
			mimeType: `video/mp4; codecs="${codecs}"`,
			url: new URL(uri, resource.url).href,
			width: resolution[0]!,
		});
	}

	return variants;
};

/**
 * parses subtitle renditions.
 *
 * @param resource master playlist
 * @returns renditions in playlist order
 */
export const parseSubtitleMaster = (resource: Resource): SubtitleRendition[] => {
	return mapDefined(linesOf(decodeUtf8From(resource.bytes)), (line) => {
		if (!line.startsWith('#EXT-X-MEDIA:')) {
			return;
		}

		const attributes = parseHlsAttributes(line);
		const uri = attributes.get('URI');
		if (attributes.get('TYPE') !== 'SUBTITLES' || !uri) {
			return;
		}

		return {
			label: attributes.get('NAME') ?? 'subtitles',
			language: attributes.get('LANGUAGE') ?? '',
			url: new URL(uri, resource.url).href,
		};
	});
};

/**
 * parses a video media playlist.
 *
 * @param resource media playlist
 * @returns duration and segments
 * @throws when the playlist is unsupported
 */
export const parseVideoMedia = (resource: Resource): MediaPlaylist => {
	const text = decodeUtf8From(resource.bytes);
	if (!text.includes('#EXT-X-ENDLIST')) {
		throw new UnsupportedPlaylistError('live HLS playlists are unsupported');
	}
	if (/^#EXT-X-(?:BYTERANGE|MAP):/m.test(text) || /^#EXT-X-KEY:(?!METHOD=NONE)/m.test(text)) {
		throw new UnsupportedPlaylistError('encrypted and byte-range HLS segments are unsupported');
	}

	const lines = linesOf(text);
	const segments: VideoSegment[] = [];
	let start = 0;

	for (const [lineIndex, line] of lines.entries()) {
		if (!line.startsWith('#EXTINF:')) {
			continue;
		}
		const duration = Number.parseFloat(line.slice(8));
		const uri = uriAfter(lines, lineIndex);
		if (!Number.isFinite(duration) || !uri) {
			throw new Error('invalid HLS media playlist');
		}
		segments.push({ duration, start, url: new URL(uri, resource.url).href });
		start += duration;
	}
	if (segments.length === 0) {
		throw new Error('empty HLS media playlist');
	}

	return { duration: start, segments };
};

/**
 * parses subtitle segment URLs.
 *
 * @param resource subtitle playlist
 * @returns segment URLs in playlist order
 */
export const parseSubtitleMedia = (resource: Resource): string[] => {
	return mapDefined(linesOf(decodeUtf8From(resource.bytes)), (line) => {
		if (line !== '' && !line.startsWith('#')) {
			return new URL(line, resource.url).href;
		}
	});
};
