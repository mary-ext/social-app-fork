import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';

import type { BskyFeedViewPreference, BskyThreadViewPreference } from '#/lib/moderation/preferences-types';

import {
	isFeedViewPref,
	isThreadViewPref,
	type PrefOf,
	updatePreferences,
	upsertPref,
} from '#/state/queries/preferences/lib/core';

/**
 * Sets feed-view preferences for a given feed, merging over any existing values.
 *
 * @param pds the PDS client.
 * @param feed the feed URI or identifier (`'home'` for the following feed).
 * @param pref the feed-view fields to apply.
 */
export async function setFeedViewPrefs(
	pds: Client,
	feed: string,
	pref: Partial<BskyFeedViewPreference>,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.filter(isFeedViewPref).findLast((p) => p.feed === feed);
		const next: PrefOf<'app.bsky.actor.defs#feedViewPref'> = {
			$type: 'app.bsky.actor.defs#feedViewPref',
			feed,
			...existing,
			...(pref as Partial<AppBskyActorDefs.FeedViewPref>),
		};
		return upsertPref(prefs, (p) => isFeedViewPref(p) && p.feed === feed, next);
	});
}

/**
 * Sets thread-view preferences, merging over any existing values.
 *
 * @param pds the PDS client.
 * @param pref the thread-view fields to apply.
 */
export async function setThreadViewPrefs(
	pds: Client,
	pref: Partial<BskyThreadViewPreference>,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isThreadViewPref);
		const next: PrefOf<'app.bsky.actor.defs#threadViewPref'> = {
			$type: 'app.bsky.actor.defs#threadViewPref',
			...existing,
			...(pref as Partial<AppBskyActorDefs.ThreadViewPref>),
		};
		return upsertPref(prefs, isThreadViewPref, next);
	});
}
