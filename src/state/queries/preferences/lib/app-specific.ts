import { type Client, ok } from '@atcute/client';

import {
	APP_SPECIFIC_PREF_TYPE as APP_SPECIFIC_PREFS_TYPE,
	type AppSpecificPrefs,
	readAppSpecificPref,
	type TimedMute,
} from '#/lib/preferences/app-specific-prefs';

import { type Pref, updatePreferences, upsertPref } from '#/state/queries/preferences/lib/core';

type AppSpecificPrefsPatch = Partial<Omit<AppSpecificPrefs, '$type'>>;

const isAppSpecificPrefs = (pref: { $type: string }): boolean => pref.$type === APP_SPECIFIC_PREFS_TYPE;

/**
 * updates app preferences from their current values, preserving unpatched fields.
 *
 * @param pds the PDS client
 * @param cb maps the current entry to a patch, or false to skip the write
 */
async function updateAppSpecificPrefs(
	pds: Client,
	cb: (current: AppSpecificPrefs) => AppSpecificPrefsPatch | false,
): Promise<void> {
	await updatePreferences(pds, (prefs) => {
		const patch = cb(readAppSpecificPref(prefs));
		if (patch === false) {
			return false;
		}

		// merge the raw entry to preserve fields from newer app versions
		const existing: object | undefined = prefs.findLast(isAppSpecificPrefs);
		const next = { ...existing, ...patch, $type: APP_SPECIFIC_PREFS_TYPE };

		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- atcute's types omit custom members of the open union
		return upsertPref(prefs, isAppSpecificPrefs, next as Pref);
	});
}

/**
 * updates app preferences, preserving unpatched fields.
 *
 * @param pds the PDS client
 * @param patch the settings to apply
 */
export async function setAppSpecificPrefs(pds: Client, patch: AppSpecificPrefsPatch): Promise<void> {
	await updateAppSpecificPrefs(pds, () => patch);
}

/**
 * fetches timed mutes from the PDS without using cached preferences.
 *
 * @param pds the PDS client
 * @param signal aborts the request
 * @returns the timed mutes
 */
export async function getTimedMutes(pds: Client, signal: AbortSignal): Promise<TimedMute[]> {
	const { preferences } = await ok(pds.get('app.bsky.actor.getPreferences', { params: {}, signal }));
	return readAppSpecificPref(preferences).timedMutes ?? [];
}

/**
 * sets or replaces an account's mute expiry.
 *
 * @param pds the PDS client
 * @param mute the account and its expiry
 */
export async function putTimedMute(pds: Client, mute: TimedMute): Promise<void> {
	await updateAppSpecificPrefs(pds, ({ timedMutes = [] }) => {
		const mutes = timedMutes.filter((entry) => entry.did !== mute.did);
		return { timedMutes: [...mutes, mute] };
	});
}

/**
 * removes matching expiry schedules without unmuting accounts.
 *
 * @param pds the PDS client
 * @param matches selects schedules to remove
 */
export async function removeTimedMutes(pds: Client, matches: (mute: TimedMute) => boolean): Promise<void> {
	await updateAppSpecificPrefs(pds, ({ timedMutes = [] }) => {
		const next = timedMutes.filter((entry) => !matches(entry));
		if (next.length === timedMutes.length) {
			return false;
		}

		return { timedMutes: next };
	});
}
