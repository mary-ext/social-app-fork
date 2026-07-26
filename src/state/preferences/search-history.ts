import { getCurrentDid } from '#/state/session';

import { account, type SearchHistoryEntry, useStorageValue } from '#/storage';

// max entries to retain
const MAX_ENTRIES = 20;

// stable identity per entry
const entryKey = (entry: SearchHistoryEntry): string =>
	entry.kind === 'profile' ? `profile:${entry.did}` : `query:${entry.query}`;

/**
 * returns the search history for the signed-in user.
 *
 * @returns array of search history entries
 */
export function useSearchHistory() {
	const did = getCurrentDid() ?? 'pwi';
	return useStorageValue(account, [did, 'searchHistory']) ?? [];
}

/**
 * records a search entry in history.
 *
 * @param entry search entry to record
 */
export function addSearchHistoryEntry(entry: SearchHistoryEntry) {
	const did = getCurrentDid();
	if (!did) {
		return;
	}

	const key = entryKey(entry);
	const current = account.get([did, 'searchHistory']) ?? [];
	account.set(
		[did, 'searchHistory'],
		[entry, ...current.filter((existing) => entryKey(existing) !== key)].slice(0, MAX_ENTRIES),
	);
}

/**
 * removes a search entry from history.
 *
 * @param entry search entry to remove
 */
export function removeSearchHistoryEntry(entry: SearchHistoryEntry) {
	const did = getCurrentDid();
	if (!did) {
		return;
	}

	const key = entryKey(entry);
	const current = account.get([did, 'searchHistory']) ?? [];
	account.set(
		[did, 'searchHistory'],
		current.filter((existing) => entryKey(existing) !== key),
	);
}
