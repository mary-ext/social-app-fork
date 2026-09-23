import type { AnyProfileView } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { isAbortError } from '#/lib/errors';

import type { Shadow } from '#/state/cache/types';
import { useProfileMuteMutationQueue } from '#/state/queries/profile';
import {
	cancelScheduledUnmutes,
	type MuteDuration,
	muteDurationToExpiry,
	scheduleUnmute,
	useTimedMute,
} from '#/state/queries/timed-mutes';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

const showError = (err: unknown) => {
	if (!isAbortError(err)) {
		Toast.show(m['common.error.issueWithDetail']({ error: String(err) }), { type: 'error' });
	}
};

/**
 * manages account mutes and their expiry schedules, with success and error toasts.
 *
 * @param profile the account to act on
 * @returns `mute`, which also changes the duration of an existing mute, and `unmute`
 */
export function useAccountMute(profile: Shadow<AnyProfileView>) {
	const queryClient = useQueryClient();
	const did = profile.did;
	const timedMute = useTimedMute(did);
	const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile);

	const isMuted = !!profile.viewer?.muted;

	const mute = async (duration: MuteDuration) => {
		const expiresAt = muteDurationToExpiry(duration);

		if (expiresAt === undefined) {
			try {
				if (!isMuted) {
					await queueMute();
				}
				// preserve the existing schedule if muting fails
				await cancelScheduledUnmutes(queryClient, [did]);
			} catch (err) {
				showError(err);
				return;
			}

			Toast.show(isMuted ? m['common.mute.durationUpdatedToast']() : m['common.mute.mutedToast']());
			return;
		}

		try {
			// save the expiry first to avoid a mute with no unmute schedule
			await scheduleUnmute(queryClient, { did, expiresAt });
		} catch (err) {
			showError(err);
			return;
		}

		if (!isMuted) {
			try {
				await queueMute();
			} catch (err) {
				showError(err);

				// a stale schedule could undo a later mute
				const rollback = timedMute
					? scheduleUnmute(queryClient, timedMute)
					: cancelScheduledUnmutes(queryClient, [did]);
				rollback.catch((rollbackErr: unknown) => {
					console.error('failed to roll back timed mute schedule', rollbackErr);
				});
				return;
			}
		}

		Toast.show(m['common.mute.mutedUntilToast']({ date: expiresAt }));
	};

	const unmute = async () => {
		try {
			await queueUnmute();
		} catch (err) {
			showError(err);
			return;
		}

		Toast.show(m['common.mute.unmutedToast']());
	};

	return { mute, unmute };
}
