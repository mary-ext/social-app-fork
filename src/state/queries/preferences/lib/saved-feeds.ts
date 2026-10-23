import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';
import { parseResourceUri } from '@atcute/lexicons/syntax';
import * as TID from '@atcute/tid';

import {
	isSavedFeedsPrefV2,
	type PrefOf,
	updatePreferences,
	upsertPref,
} from '#/state/queries/preferences/lib/core';

/**
 * Validates a saved feed: it must carry an `id`, and a `feed`/`list` type must match its URI collection.
 *
 * @param savedFeed the saved feed to validate.
 * @throws if the feed lacks an `id` or its type does not match its URI collection.
 */
function validateSavedFeed(savedFeed: AppBskyActorDefs.SavedFeed): void {
	if (!savedFeed.id) {
		throw new Error('Saved feed must have an `id` - use a TID');
	}

	if (savedFeed.type === 'feed' || savedFeed.type === 'list') {
		const collection = parseResourceUri(savedFeed.value).collection;
		const isFeed = collection === 'app.bsky.feed.generator';
		const isList = collection === 'app.bsky.graph.list';

		if (savedFeed.type === 'feed' && !isFeed) {
			throw new Error(`Saved feed of type 'feed' must be a feed, got ${collection}`);
		}
		if (savedFeed.type === 'list' && !isList) {
			throw new Error(`Saved feed of type 'list' must be a list, got ${collection}`);
		}
	}
}

/**
 * Read-modify-write of the v2 saved-feeds pref, enforcing pinned-first ordering. The legacy v1
 * `savedFeedsPref` is not written (the v1 double-write `@atproto/api` performed was dropped).
 *
 * @param pds the PDS client.
 * @param cb maps the current saved feeds to the next set.
 * @returns the saved feeds returned by `cb` (pre-sort).
 */
async function updateSavedFeedsV2Preferences(
	pds: Client,
	cb: (savedFeeds: AppBskyActorDefs.SavedFeed[]) => AppBskyActorDefs.SavedFeed[],
): Promise<AppBskyActorDefs.SavedFeed[]> {
	let maybeMutatedSavedFeeds: AppBskyActorDefs.SavedFeed[] = [];

	await updatePreferences(pds, (prefs) => {
		const existingV2Items = [...(prefs.findLast(isSavedFeedsPrefV2)?.items ?? [])];
		const newSavedFeeds = cb(existingV2Items);
		maybeMutatedSavedFeeds = newSavedFeeds;

		const nextV2: PrefOf<'app.bsky.actor.defs#savedFeedsPrefV2'> = {
			$type: 'app.bsky.actor.defs#savedFeedsPrefV2',
			// enforce ordering: pinned first, then saved (preserving order within each group)
			// oxlint-disable-next-line unicorn/no-array-sort -- sorting our own copy of `newSavedFeeds`
			items: [...newSavedFeeds].sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1)),
		};

		return upsertPref(prefs, isSavedFeedsPrefV2, nextV2);
	});

	return maybeMutatedSavedFeeds;
}

/**
 * Replaces the entire saved-feeds set, de-duplicating by `id` while preserving order.
 *
 * @param pds the PDS client.
 * @param savedFeeds the saved feeds to write.
 */
export async function overwriteSavedFeeds(
	pds: Client,
	savedFeeds: AppBskyActorDefs.SavedFeed[],
): Promise<void> {
	savedFeeds.forEach(validateSavedFeed);
	const uniqueSavedFeeds = new Map<string, AppBskyActorDefs.SavedFeed>();
	savedFeeds.forEach((feed) => {
		// remove and re-insert to preserve order
		if (uniqueSavedFeeds.has(feed.id)) {
			uniqueSavedFeeds.delete(feed.id);
		}
		uniqueSavedFeeds.set(feed.id, feed);
	});
	await updateSavedFeedsV2Preferences(pds, () => Array.from(uniqueSavedFeeds.values()));
}

/**
 * Updates the `pinned` flag of existing saved feeds (matched by `id`); other fields are left untouched.
 *
 * @param pds the PDS client.
 * @param savedFeedsToUpdate the saved feeds whose `pinned` flag should be applied.
 */
export async function updateSavedFeeds(
	pds: Client,
	savedFeedsToUpdate: AppBskyActorDefs.SavedFeed[],
): Promise<void> {
	savedFeedsToUpdate.forEach(validateSavedFeed);
	await updateSavedFeedsV2Preferences(pds, (savedFeeds) =>
		savedFeeds.map((savedFeed) => {
			const updatedVersion = savedFeedsToUpdate.find((updated) => savedFeed.id === updated.id);
			if (updatedVersion) {
				// only update pinned
				return { ...savedFeed, pinned: updatedVersion.pinned };
			}
			return savedFeed;
		}),
	);
}

/**
 * Appends new saved feeds, assigning each a fresh TID `id`.
 *
 * @param pds the PDS client.
 * @param savedFeeds the feeds to add.
 */
export async function addSavedFeeds(
	pds: Client,
	savedFeeds: Pick<AppBskyActorDefs.SavedFeed, 'pinned' | 'type' | 'value'>[],
): Promise<void> {
	const toSave: AppBskyActorDefs.SavedFeed[] = savedFeeds.map((f) => ({ ...f, id: TID.now() }));
	toSave.forEach(validateSavedFeed);
	await updateSavedFeedsV2Preferences(pds, (current) => [...current, ...toSave]);
}

/**
 * Removes saved feeds by `id`.
 *
 * @param pds the PDS client.
 * @param ids the saved-feed `id`s to remove.
 */
export async function removeSavedFeeds(pds: Client, ids: string[]): Promise<void> {
	await updateSavedFeedsV2Preferences(pds, (savedFeeds) =>
		savedFeeds.filter((feed) => !ids.includes(feed.id)),
	);
}
