import { device, useStorageValue } from '#/storage';
import type { SkinTone } from '#/storage/schema';

// cap for the picker's recently-used list.
const RECENTS_LIMIT = 36;

/**
 * returns the preferred emoji skin tone.
 *
 * @returns emoji skin tone
 */
export function useEmojiSkinTone() {
	return useStorageValue(device, ['emojiSkinTone']) ?? 1;
}

/**
 * sets the preferred emoji skin tone.
 *
 * @param tone skin tone
 */
export function setEmojiSkinTone(tone: SkinTone) {
	device.set(['emojiSkinTone'], tone);
}

/**
 * returns recently used emoji IDs.
 *
 * @returns array of emoji IDs
 */
export function useRecentEmojis() {
	return useStorageValue(device, ['recentEmojis']) ?? [];
}

/**
 * records an emoji as recently used.
 *
 * @param id emoji ID to record
 */
export function addRecentEmoji(id: string) {
	const current = device.get(['recentEmojis']) ?? [];
	device.set(
		['recentEmojis'],
		[id, ...current.filter((existing) => existing !== id)].slice(0, RECENTS_LIMIT),
	);
}
