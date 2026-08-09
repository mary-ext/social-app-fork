import { decodeUtf8From } from '@atcute/uint8array';

import type { SubtitleCue } from '../shared/protocol';
import type { Fetch } from './network';
import { parseSubtitleMedia, type SubtitleRendition } from './playlist';
import { parseWebVtt } from './webvtt';

type SubtitleStreamOptions = {
	rendition: SubtitleRendition;
	fetchResource: Fetch;
	signal: AbortSignal;
	emit: (cues: SubtitleCue[]) => void;
};

/**
 * streams cues from a subtitle rendition.
 *
 * failed segments are skipped.
 *
 * @param options subtitle stream configuration
 * @returns promise that resolves when all segments are processed
 * @throws when the rendition playlist cannot be loaded
 */
export const streamSubtitleCues = async ({
	rendition,
	fetchResource,
	signal,
	emit,
}: SubtitleStreamOptions): Promise<void> => {
	const { segments } = parseSubtitleMedia(await fetchResource('subtitle', rendition.url, signal));

	// process segments in order to preserve the timestamp-map anchor.
	let anchor: number | undefined;

	for (const segment of segments) {
		let document: string;
		try {
			document = decodeUtf8From((await fetchResource('subtitle', segment.url, signal)).bytes);
		} catch {
			if (signal.aborted) {
				return;
			}

			// do not replace a missing first anchor with a later segment's map.
			anchor ??= 0;
			continue;
		}
		if (signal.aborted) {
			return;
		}

		const parsed = parseWebVtt(document, anchor);

		anchor = parsed.anchor;
		emit(parsed.cues);
	}
};
