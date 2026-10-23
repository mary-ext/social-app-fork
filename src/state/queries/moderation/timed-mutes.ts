import type { Did } from '@atcute/lexicons';

import type { TimedMute } from '#/lib/preferences/app-specific-prefs';

import { usePreferencesQuery } from '#/state/queries/preferences/preferences';

const EMPTY_TIMED_MUTES: TimedMute[] = [];

/**
 * reads account-synced unmute schedules.
 *
 * @returns schedules, including pending expired mutes; empty until preferences load
 */
export function useTimedMutes(): TimedMute[] {
	const { data } = usePreferencesQuery();
	return data?.appPrefs.timedMutes ?? EMPTY_TIMED_MUTES;
}

/**
 * reads an account's unmute schedule.
 *
 * @param did the muted account
 * @returns the schedule, or undefined if absent or preferences haven't loaded
 */
export function useTimedMute(did: Did): TimedMute | undefined {
	return useTimedMutes().find((mute) => mute.did === did);
}
