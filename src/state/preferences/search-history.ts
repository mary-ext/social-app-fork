import { getCurrentDid } from '#/state/session';

import { account, type SearchHistoryEntry, useStorageValue } from '#/storage';

/** the most recent entries to retain; older ones drop off as new searches arrive. */
const MAX_ENTRIES = 20;

/** a stable identity per entry, so re-searching the same thing moves it to the front instead of duplicating. */
const entryKey = (entry: SearchHistoryEntry): string =>
	entry.kind === 'profile' ? `profile:${entry.did}` : `query:${entry.query}`;

/** the signed-in account's unified search history of queries and visited profiles, most recent first. */
export function useSearchHistory() {
	const did = getCurrentDid() ?? 'pwi';
	return useStorageValue(account, [did, 'searchHistory']) ?? [];
}

/**
 * records a search entry, moving it to the front of the list, deduping, and capping the length. does nothing
 * when signed out.
 *
 * @param entry entry to record
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
 * drops a search entry from the history. does nothing when signed out.
 *
 * @param entry entry to remove
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
