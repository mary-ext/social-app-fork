import type { Gif } from '#/lib/gif';

import { getCurrentDid } from '#/state/session';

import { account, useStorageValue } from '#/storage';

// cap for the picker's recents list.
const RECENTS_LIMIT = 20;

/**
 * returns recently picked GIFs.
 *
 * @returns array of recent GIFs
 */
export function useRecentGifs() {
	const did = getCurrentDid() ?? 'pwi';
	return useStorageValue(account, [did, 'recentGifs']) ?? [];
}

/**
 * records a GIF as recently picked.
 *
 * @param gif GIF to record
 */
export function addRecentGif(gif: Gif) {
	const did = getCurrentDid();
	if (!did) {
		return;
	}

	const current = account.get([did, 'recentGifs']) ?? [];
	account.set(
		[did, 'recentGifs'],
		[gif, ...current.filter((existing) => existing.id !== gif.id)].slice(0, RECENTS_LIMIT),
	);
}
