import { useCallback } from 'react';

import { device, useStorage } from '#/storage';

/** emoji skin tone: 1 = default/yellow, 2–6 = the five Fitzpatrick tones. */
export type SkinTone = 1 | 2 | 3 | 4 | 5 | 6;

/** cap for the picker's recently-used list. */
const RECENTS_LIMIT = 36;

/**
 * reads and updates the persisted emoji skin tone.
 *
 * @returns the current tone (defaulting to 1) and a setter
 */
export function useEmojiSkinTone() {
	const [tone = 1, setTone] = useStorage(device, ['emojiSkinTone']);
	return [tone as SkinTone, (next: SkinTone) => setTone(next)] as const;
}

/**
 * reads the persisted recently-used emoji and exposes an `add` that moves an id to the front, dedupes, and
 * caps the list.
 *
 * @returns the recent emoji ids (most recent first) and an `add` function
 */
export function useRecentEmojis() {
	const [recents = [], setRecents] = useStorage(device, ['recentEmojis']);
	const add = useCallback(
		(id: string) => {
			const current = device.get(['recentEmojis']) ?? [];
			setRecents([id, ...current.filter((existing) => existing !== id)].slice(0, RECENTS_LIMIT));
		},
		[setRecents],
	);
	return [recents, add] as const;
}
