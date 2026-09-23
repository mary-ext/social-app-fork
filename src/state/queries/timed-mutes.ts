import { useEffect } from 'react';

import { type Client, ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';

import { isDocumentVisible, onVisibilityChange } from '#/lib/browser/visibility';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { RQKEY as MUTED_ACCOUNTS_RQKEY } from '#/state/queries/my-muted-accounts';
import { preferencesQueryKey, usePreferencesQuery } from '#/state/queries/preferences';
import { getTimedMutes, putTimedMute, removeTimedMutes } from '#/state/queries/preferences/agent';
import type { TimedMute } from '#/state/queries/preferences/app-specific-prefs';
import type { UsePreferencesQueryResponse } from '#/state/queries/preferences/types';
import { getClients, getCurrentDid } from '#/state/session';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// recheck hourly; setTimeout overflows beyond ~24.8 days
const MAX_TIMER_DELAY = HOUR;
const RETRY_BASE_DELAY = MINUTE;
const RETRY_MAX_DELAY = HOUR;

const EMPTY_TIMED_MUTES: TimedMute[] = [];

// #region durations

export type MuteDuration = '1h' | '8h' | '24h' | '3d' | '7d' | '30d' | 'forever';

const DURATION_MS: Record<Exclude<MuteDuration, 'forever'>, number> = {
	'1h': HOUR,
	'8h': 8 * HOUR,
	'24h': DAY,
	'3d': 3 * DAY,
	'7d': 7 * DAY,
	'30d': 30 * DAY,
};

/**
 * calculates a mute's expiry from the current time.
 *
 * @param duration how long the mute lasts
 * @returns an ISO timestamp, or undefined for `forever`
 */
export const muteDurationToExpiry = (duration: MuteDuration): string | undefined => {
	if (duration === 'forever') {
		return undefined;
	}

	return new Date(Date.now() + DURATION_MS[duration]).toISOString();
};

/**
 * checks whether a mute is due to expire.
 *
 * @param mute the timed mute
 * @param now the current time, in epoch milliseconds
 * @returns true at or after the expiry
 */
export const isTimedMuteExpired = (mute: TimedMute, now: number): boolean =>
	Date.parse(mute.expiresAt) <= now;

// #endregion

// #region reads

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

// #endregion

// #region writes

const patchCachedTimedMutes = async (
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

// #endregion

// #region expiry

/**
 * unmutes expired accounts using current PDS preferences. skips if another tab holds the lock.
 *
 * @throws if any account failed to be unmuted
 */
async function liftExpiredMutes({
	account,
	appview,
	pds,
	queryClient,
	signal,
}: {
	account: Did;
	appview: Client;
	pds: Client;
	queryClient: QueryClient;
	signal: AbortSignal;
}): Promise<void> {
	await navigator.locks.request(`timed-mutes:${account}`, { ifAvailable: true }, async (lock) => {
		if (!lock) {
			return;
		}

		// another device may have extended the mute since the last fetch
		const now = Date.now();
		const expired = (await getTimedMutes(pds, signal)).filter((mute) => isTimedMuteExpired(mute, now));
		if (expired.length === 0) {
			return;
		}

		const lifted: TimedMute[] = [];
		let failed = 0;
		for (const mute of expired) {
			signal.throwIfAborted();

			try {
				await ok(
					appview.post('app.bsky.graph.unmuteActor', { as: null, input: { actor: mute.did }, signal }),
				);
			} catch (err) {
				if (signal.aborted) {
					throw err;
				}

				console.error('failed to lift timed mute', err);
				failed++;
				continue;
			}

			lifted.push(mute);
			updateProfileShadow(queryClient, mute.did, { muted: false, mutedOnlyReposts: false });
		}

		if (lifted.length > 0) {
			// preserve schedules changed during the unmute requests
			const matches = (entry: TimedMute) =>
				lifted.some((mute) => mute.did === entry.did && mute.expiresAt === entry.expiresAt);

			await patchCachedTimedMutes(queryClient, (mutes) => mutes.filter((mute) => !matches(mute)));
			void queryClient.invalidateQueries({ queryKey: MUTED_ACCOUNTS_RQKEY() });

			await removeTimedMutes(pds, matches);
		}

		if (failed > 0) {
			throw new Error(`failed to lift ${failed} timed mutes`);
		}
	});
}

// jitter avoids simultaneous retries across tabs and devices
const retryDelay = (failures: number) => {
	const delay = Math.min(RETRY_BASE_DELAY * 2 ** failures, RETRY_MAX_DELAY);
	return delay / 2 + Math.random() * (delay / 2);
};

/** unmutes expired accounts while the app is open, including overdue mutes. mount once per signed-in account. */
export function useTimedMuteExpiry(): void {
	const queryClient = useQueryClient();
	const timedMutes = useTimedMutes();

	const nextExpiry = Math.min(...timedMutes.map((mute) => Date.parse(mute.expiresAt)));

	useEffect(() => {
		const { appview, pds } = getClients();
		const account = getCurrentDid();
		if (nextExpiry === Infinity || !pds || !account) {
			return;
		}

		const controller = new AbortController();
		const signal = controller.signal;

		let timer: ReturnType<typeof setTimeout> | undefined;
		let running = false;
		let failures = 0;

		const schedule = (delay: number) => {
			clearTimeout(timer);
			timer = setTimeout(() => void check(), Math.min(delay, MAX_TIMER_DELAY));
		};

		const check = async () => {
			if (running) {
				return;
			}

			const remaining = nextExpiry - Date.now();
			if (remaining > 0) {
				schedule(remaining);
				return;
			}

			running = true;
			try {
				await liftExpiredMutes({ account, appview, pds, queryClient, signal });
				failures = 0;
			} catch (err) {
				if (!signal.aborted) {
					console.error('failed to lift expired timed mutes', err);
					failures++;
				}
			} finally {
				running = false;
			}

			// changing the cached next expiry cleans up this effect
			if (signal.aborted) {
				return;
			}

			// refetch after lock contention, failures, or an expiry changed on another device
			void queryClient.invalidateQueries({ queryKey: preferencesQueryKey });
			schedule(retryDelay(failures));
		};

		// background timers may be delayed; check on return without bypassing failure backoff
		const onWake = () => {
			if (failures === 0 && isDocumentVisible()) {
				void check();
			}
		};

		void check();
		const unsubscribeVisibility = onVisibilityChange(onWake);

		return () => {
			controller.abort();
			clearTimeout(timer);
			unsubscribeVisibility();
		};
	}, [nextExpiry, queryClient]);
}

// #endregion
