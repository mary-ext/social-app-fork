import { getCurrentDid } from '#/state/session';

import type { Gif } from '#/features/gifPicker/types';

import { account, useStorageValue } from '#/storage';

/** cap for the picker's recents list. */
const RECENTS_LIMIT = 20;

/** get recently picked gifs. */
export function useRecentGifs() {
	const did = getCurrentDid() ?? 'pwi';
	return useStorageValue(account, [did, 'recentGifs']) ?? [];
}

/**
 * records a gif as recently picked.
 *
 * @param gif gif to record
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
