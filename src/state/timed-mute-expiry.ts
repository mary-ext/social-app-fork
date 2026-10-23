import { useEffect } from 'react';

import { type Client, ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';

import { isDocumentVisible, onVisibilityChange } from '#/lib/browser/visibility';
import { isTimedMuteExpired } from '#/lib/moderation/mute-duration';
import type { TimedMute } from '#/lib/preferences/app-specific-prefs';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { RQKEY_MY_MUTED as MUTED_ACCOUNTS_RQKEY } from '#/state/queries/moderation/keys';
import { patchCachedTimedMutes } from '#/state/queries/moderation/schedule-unmute';
import { useTimedMutes } from '#/state/queries/moderation/timed-mutes';
import { preferencesQueryKey } from '#/state/queries/preferences/keys';
import { getTimedMutes, removeTimedMutes } from '#/state/queries/preferences/lib/app-specific';
import { getClients, getCurrentDid } from '#/state/session';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// recheck hourly; setTimeout overflows beyond ~24.8 days
const MAX_TIMER_DELAY = HOUR;
const RETRY_BASE_DELAY = MINUTE;
const RETRY_MAX_DELAY = HOUR;

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
