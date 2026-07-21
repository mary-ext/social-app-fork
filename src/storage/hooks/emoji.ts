import { device, useStorage } from '#/storage';
import type { SkinTone } from '#/storage/schema';

/** cap for the picker's recently-used list. */
const RECENTS_LIMIT = 36;

/**
 * reads and updates the persisted emoji skin tone.
 *
 * @returns the current tone (defaulting to 1) and a setter
 */
export function useEmojiSkinTone() {
	const [tone = 1, setTone] = useStorage(device, ['emojiSkinTone']);
	return [tone, (next: SkinTone) => setTone(next)] as const;
}

/**
 * reads the persisted recently-used emoji and exposes an `add` that moves an id to the front, dedupes, and
 * caps the list.
 *
 * @returns the recent emoji ids (most recent first) and an `add` function
 */
export function useRecentEmojis() {
	const [recents = [], setRecents] = useStorage(device, ['recentEmojis']);
	const add = (id: string) => {
		const current = device.get(['recentEmojis']) ?? [];
		setRecents([id, ...current.filter((existing) => existing !== id)].slice(0, RECENTS_LIMIT));
	};
	return [recents, add] as const;
}
