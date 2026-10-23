import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import type { LabelVisibility } from '#/lib/moderation/preferences-types';

import {
	isAdultContentPref,
	isContentLabelPref,
	type Pref,
	type PrefOf,
	updatePreferences,
	upsertPref,
} from '#/state/queries/preferences/lib/core';

/**
 * Toggles the adult-content preference.
 *
 * @param pds the PDS client.
 * @param enabled whether adult content is enabled.
 */
export async function setAdultContentEnabled(pds: Client, enabled: boolean): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const next: PrefOf<'app.bsky.actor.defs#adultContentPref'> = {
			$type: 'app.bsky.actor.defs#adultContentPref',
			enabled,
		};
		return upsertPref(prefs, isAdultContentPref, next);
	});
}

const isContentLabelPrefFor =
	(label: string, labelerDid: Did | undefined) =>
	(pref: Pref): boolean =>
		isContentLabelPref(pref) && pref.label === label && pref.labelerDid === labelerDid;

/**
 * sets a content-label visibility preference, optionally scoped to a labeler.
 *
 * @param pds the PDS client
 * @param key the label identifier
 * @param value the desired visibility
 * @param labelerDid the labeler the preference applies to, or undefined for a global preference
 */
export async function setContentLabelPref(
	pds: Client,
	key: string,
	value: LabelVisibility,
	labelerDid?: Did,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const labelPref: PrefOf<'app.bsky.actor.defs#contentLabelPref'> = {
			$type: 'app.bsky.actor.defs#contentLabelPref',
			label: key,
			labelerDid,
			visibility: value,
		};
		return upsertPref(prefs, isContentLabelPrefFor(key, labelerDid), labelPref);
	});
}

/**
 * drops a content-label visibility preference, letting the label fall back to its default. No-ops when no
 * such preference is stored.
 *
 * @param pds the PDS client
 * @param key the label identifier
 * @param labelerDid the labeler the preference applies to, or undefined for a global preference
 */
export async function removeContentLabelPref(pds: Client, key: string, labelerDid?: Did): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const matches = isContentLabelPrefFor(key, labelerDid);
		const next = prefs.filter((pref) => !matches(pref));
		// re-picking the selected option lands here; skip the round-trip
		return next.length === prefs.length ? false : next;
	});
}
