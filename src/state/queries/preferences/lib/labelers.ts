import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import {
	isLabelersPref,
	type PrefOf,
	updatePreferences,
	upsertPref,
} from '#/state/queries/preferences/lib/core';

/**
 * Adds a labeler subscription to the labelers preference, de-duplicating by DID.
 *
 * @param pds the PDS client.
 * @param did the labeler DID to subscribe to.
 */
export async function addLabeler(pds: Client, did: Did): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isLabelersPref)?.labelers ?? [];
		const next: PrefOf<'app.bsky.actor.defs#labelersPref'> = {
			$type: 'app.bsky.actor.defs#labelersPref',
			labelers: [...existing.filter((labeler) => labeler.did !== did), { did }],
		};
		return upsertPref(prefs, isLabelersPref, next);
	});
}

/**
 * Removes a labeler subscription from the labelers preference.
 *
 * @param pds the PDS client.
 * @param did the labeler DID to unsubscribe from.
 */
export async function removeLabeler(pds: Client, did: Did): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const existing = prefs.findLast(isLabelersPref)?.labelers ?? [];
		const next: PrefOf<'app.bsky.actor.defs#labelersPref'> = {
			$type: 'app.bsky.actor.defs#labelersPref',
			labelers: existing.filter((labeler) => labeler.did !== did),
		};
		return upsertPref(prefs, isLabelersPref, next);
	});
}
