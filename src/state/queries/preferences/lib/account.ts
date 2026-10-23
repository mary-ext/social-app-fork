import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';

import type { BskyInterestsPreference } from '#/lib/moderation/preferences-types';

import {
	isInterestsPref,
	isPostInteractionSettingsPref,
	isVerificationPrefs,
	type PrefOf,
	updatePreferences,
	upsertPref,
} from '#/state/queries/preferences/lib/core';

/**
 * replaces interest tags and sets `updatedAt` to the current time.
 *
 * @param pds the PDS client.
 * @param tags the interest tags to store.
 * @returns the written preference.
 */
export async function setInterestsPref(pds: Client, tags: string[]): Promise<BskyInterestsPreference> {
	const pref: BskyInterestsPreference = { tags, updatedAt: new Date().toISOString() };
	await updatePreferences(pds, (prefs) => {
		return upsertPref(prefs, isInterestsPref, { $type: 'app.bsky.actor.defs#interestsPref', ...pref });
	});
	return pref;
}

/**
 * Sets the default post-interaction settings (threadgate/postgate rules) applied to new posts.
 *
 * @param pds the PDS client.
 * @param settings the post-interaction settings to apply.
 */
export async function setPostInteractionSettings(
	pds: Client,
	settings: AppBskyActorDefs.PostInteractionSettingsPref,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isPostInteractionSettingsPref);
		const next: PrefOf<'app.bsky.actor.defs#postInteractionSettingsPref'> = {
			$type: 'app.bsky.actor.defs#postInteractionSettingsPref',
			...existing,
			postgateEmbeddingRules: settings.postgateEmbeddingRules,
			threadgateAllowRules: settings.threadgateAllowRules,
		};
		return upsertPref(prefs, isPostInteractionSettingsPref, next);
	});
}

/**
 * Sets the verification-badge preferences.
 *
 * @param pds the PDS client.
 * @param settings the verification preferences to apply.
 */
export async function setVerificationPrefs(
	pds: Client,
	settings: AppBskyActorDefs.VerificationPrefs,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const next: PrefOf<'app.bsky.actor.defs#verificationPrefs'> = {
			$type: 'app.bsky.actor.defs#verificationPrefs',
			hideBadges: settings.hideBadges,
		};
		return upsertPref(prefs, isVerificationPrefs, next);
	});
}
