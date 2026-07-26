import { device, useStorageValue } from '#/storage';
import type { SkinTone } from '#/storage/schema';

/** cap for the picker's recently-used list. */
const RECENTS_LIMIT = 36;

/** the persisted emoji skin tone, defaulting to 1. */
export function useEmojiSkinTone() {
	return useStorageValue(device, ['emojiSkinTone']) ?? 1;
}

export function setEmojiSkinTone(tone: SkinTone) {
	device.set(['emojiSkinTone'], tone);
}

/** the persisted recently-used emoji ids, most recent first. */
export function useRecentEmojis() {
	return useStorageValue(device, ['recentEmojis']) ?? [];
}

/**
 * records an emoji as recently used, moving it to the front of the list, deduping, and capping the length.
 *
 * @param id emoji id to record
 */
export function addRecentEmoji(id: string) {
	const current = device.get(['recentEmojis']) ?? [];
	device.set(
		['recentEmojis'],
		[id, ...current.filter((existing) => existing !== id)].slice(0, RECENTS_LIMIT),
	);
}
