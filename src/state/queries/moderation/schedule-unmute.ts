import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import type { QueryClient } from '@tanstack/react-query';

import type { TimedMute } from '#/lib/preferences/app-specific-prefs';
import type { UsePreferencesQueryResponse } from '#/lib/preferences/types';

import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { putTimedMute, removeTimedMutes } from '#/state/queries/preferences/lib/app-specific';
import { getClients } from '#/state/session';

/**
 * patches the unmute schedules held in the preferences cache, without writing to the PDS.
 *
 * @param queryClient the query client holding the preferences cache
 * @param update maps the cached schedules to the new ones
 */
export const patchCachedTimedMutes = async (
	queryClient: QueryClient,
	update: (mutes: TimedMute[]) => TimedMute[],
): Promise<void> => {
	// prevent an in-flight fetch from overwriting the patch
	await queryClient.cancelQueries({ queryKey: preferencesQueryKey });
	queryClient.setQueryData<UsePreferencesQueryResponse>(
		preferencesQueryKey,
		(old) =>
			old && { ...old, appPrefs: { ...old.appPrefs, timedMutes: update(old.appPrefs.timedMutes ?? []) } },
	);
};

const writeTimedMutes = async (
	queryClient: QueryClient,
	update: (mutes: TimedMute[]) => TimedMute[],
	write: (pds: Client) => Promise<void>,
): Promise<void> => {
	await patchCachedTimedMutes(queryClient, update);

	try {
		await write(getClients().pds!);
	} finally {
		void queryClient.invalidateQueries({ queryKey: preferencesQueryKey });
	}
};

/**
 * sets or replaces an unmute schedule without muting the account.
 *
 * @param queryClient the query client holding the preferences cache
 * @param mute the account and when to unmute it
 */
export async function scheduleUnmute(queryClient: QueryClient, mute: TimedMute): Promise<void> {
	await writeTimedMutes(
		queryClient,
		(mutes) => [...mutes.filter((entry) => entry.did !== mute.did), mute],
		(pds) => putTimedMute(pds, mute),
	);
}

/**
 * cancels unmute schedules without changing mute state. skips the write if none match the cache.
 *
 * @param queryClient the query client holding the preferences cache
 * @param dids the accounts whose schedules to cancel
 */
export async function cancelScheduledUnmutes(queryClient: QueryClient, dids: readonly Did[]): Promise<void> {
	const matches = (mute: TimedMute) => dids.includes(mute.did);

	const cached = queryClient.getQueryData<UsePreferencesQueryResponse>(preferencesQueryKey);
	if (!cached?.appPrefs.timedMutes?.some(matches)) {
		return;
	}

	await writeTimedMutes(
		queryClient,
		(mutes) => mutes.filter((mute) => !matches(mute)),
		(pds) => removeTimedMutes(pds, matches),
	);
}
