import { decodeUtf8From } from '@atcute/uint8array';

import { limitConcurrency } from '#/lib/utils/task';

import type { SubtitleRenditionCues } from '../shared/protocol';
import type { Fetch } from './network';
import { parseSubtitleMedia, type SubtitleRendition } from './playlist';
import { parseWebVtt } from './webvtt';

const MAX_CONCURRENT_SEGMENTS = 4;

/**
 * loads subtitle cues without failing playback.
 *
 * @param renditions subtitle renditions
 * @param fetchResource resource fetcher
 * @param signal abort signal
 * @returns loaded cues in rendition order
 */
export const loadSubtitleCues = async (
	renditions: SubtitleRendition[],
	fetchResource: Fetch,
	signal: AbortSignal,
): Promise<SubtitleRenditionCues[]> => {
	const fetchSegment = limitConcurrency(MAX_CONCURRENT_SEGMENTS, async (url: string) => {
		try {
			return decodeUtf8From((await fetchResource('subtitle', url, signal)).bytes);
		} catch {
			return '';
		}
	});

	const loaded = await Promise.all(
		renditions.map(async ({ label, language, url }) => {
			let segments: string[];

			try {
				segments = parseSubtitleMedia(await fetchResource('subtitle', url, signal));
			} catch {
				return null;
			}
			const documents = await Promise.all(segments.map(fetchSegment));
			if (signal.aborted) {
				return null;
			}

			return { id: url, label, language, cues: parseWebVtt(documents) };
		}),
	);

	return loaded.filter((entry) => entry !== null);
};
