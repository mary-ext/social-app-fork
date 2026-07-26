import { useSession } from '#/state/session';

import { account, type SearchHistoryEntry, useStorageValue } from '#/storage';

/** the most recent entries to retain; older ones drop off as new searches arrive. */
const MAX_ENTRIES = 20;

/** a stable identity per entry, so re-searching the same thing moves it to the front instead of duplicating. */
const entryKey = (entry: SearchHistoryEntry): string =>
	entry.kind === 'profile' ? `profile:${entry.did}` : `query:${entry.query}`;

/**
 * the signed-in account's unified search history of queries and visited profiles.
 *
 * @returns an object containing the search history list and functions to add or remove entries.
 */
export function useSearchHistory() {
	const { currentAccount } = useSession();
	// fall back to a shared 'pwi' (public web interface) bucket when signed out.
	const did = currentAccount?.did ?? 'pwi';
	const history = useStorageValue(account, [did, 'searchHistory']) ?? [];

	const record = (entry: SearchHistoryEntry) => {
		const key = entryKey(entry);
		const current = account.get([did, 'searchHistory']) ?? [];
		account.set(
			[did, 'searchHistory'],
			[entry, ...current.filter((existing) => entryKey(existing) !== key)].slice(0, MAX_ENTRIES),
		);
	};

	const remove = (entry: SearchHistoryEntry) => {
		const key = entryKey(entry);
		const current = account.get([did, 'searchHistory']) ?? [];
		account.set(
			[did, 'searchHistory'],
			current.filter((existing) => entryKey(existing) !== key),
		);
	};

	return { history, record, remove };
}
