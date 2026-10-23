import type { AnyProfileView } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { useToggleMutationQueue } from '#/lib/query/toggle-mutation-queue';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import type { Shadow } from '#/state/cache/types';
import { RQKEY_MY_MUTED } from '#/state/queries/moderation/keys';
import { cancelScheduledUnmutes } from '#/state/queries/moderation/schedule-unmute';
import { getClients } from '#/state/session';

const forgetUnmuteSchedule = (queryClient: QueryClient, did: Did) => {
	cancelScheduledUnmutes(queryClient, [did]).catch((err: unknown) => {
		console.error('failed to cancel timed mute schedule', err);
	});
};

export function useProfileMuteMutationQueue(profile: Shadow<AnyProfileView>) {
	const queryClient = useQueryClient();
	const did = profile.did;
	const initialMuted = profile.viewer?.muted;
	const muteMutation = useProfileMuteMutation();
	const unmuteMutation = useProfileUnmuteMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialMuted,
		runMutation: async (_prevMuted, shouldMute) => {
			if (shouldMute) {
				await muteMutation.mutateAsync({
					did,
				});
				return true;
			} else {
				await unmuteMutation.mutateAsync({
					did,
				});
				return false;
			}
		},
		onSuccess(finalMuted) {
			// finalize
			updateProfileShadow(queryClient, did, { muted: finalMuted });

			// muting must preserve the schedule saved before this mutation
			if (!finalMuted) {
				forgetUnmuteSchedule(queryClient, did);
			}
		},
	});

	const queueMute = () => {
		// optimistically update. a full mute replaces any stored repost-only scope on the server, so clear it here too
		updateProfileShadow(queryClient, did, {
			muted: true,
			mutedOnlyReposts: false,
		});
		return queueToggle(true);
	};

	const queueUnmute = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			muted: false,
			mutedOnlyReposts: false,
		});
		return queueToggle(false);
	};

	return [queueMute, queueUnmute] as const;
}

/**
 * toggles a repost-only mute: muting hides just the account's reposts, unmuting removes the mute entirely.
 * not applicable while the account is fully muted.
 *
 * @param profile the account to mute the reposts of
 * @returns a `[queueMuteReposts, queueUnmuteReposts]` pair
 */
export function useProfileMuteRepostsMutationQueue(profile: Shadow<AnyProfileView>) {
	const queryClient = useQueryClient();
	const did = profile.did;
	const initialMutedOnlyReposts = !!profile.viewer?.mutedOnlyReposts;
	const muteRepostsMutation = useProfileMuteRepostsMutation();
	const unmuteMutation = useProfileUnmuteMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialMutedOnlyReposts,
		runMutation: async (_prevMutedOnlyReposts, shouldMute) => {
			if (shouldMute) {
				await muteRepostsMutation.mutateAsync({
					did,
				});
				return true;
			} else {
				await unmuteMutation.mutateAsync({
					did,
				});
				return false;
			}
		},
		onSuccess(finalMutedOnlyReposts) {
			// finalize
			updateProfileShadow(queryClient, did, { mutedOnlyReposts: finalMutedOnlyReposts });

			// repost-only changes replace full mutes, so their expiry no longer applies
			forgetUnmuteSchedule(queryClient, did);
		},
	});

	const queueMuteReposts = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			mutedOnlyReposts: true,
		});
		return queueToggle(true);
	};

	const queueUnmuteReposts = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			mutedOnlyReposts: false,
		});
		return queueToggle(false);
	};

	return [queueMuteReposts, queueUnmuteReposts] as const;
}

function useProfileMuteMutation() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return useMutation<void, Error, { did: Did }>({
		mutationFn: async ({ did }) => {
			await ok(
				appview.post('app.bsky.graph.muteActor', {
					as: null,
					input: { actor: did },
				}),
			);
		},
		onSuccess() {
			void queryClient.invalidateQueries({ queryKey: RQKEY_MY_MUTED() });
		},
	});
}

function useProfileMuteRepostsMutation() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return useMutation<void, Error, { did: Did }>({
		mutationFn: async ({ did }) => {
			await ok(
				appview.post('app.bsky.graph.muteActor', {
					as: null,
					input: { actor: did, onlyReposts: true },
				}),
			);
		},
		onSuccess() {
			void queryClient.invalidateQueries({ queryKey: RQKEY_MY_MUTED() });
		},
	});
}

function useProfileUnmuteMutation() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return useMutation<void, Error, { did: Did }>({
		mutationFn: async ({ did }) => {
			await ok(
				appview.post('app.bsky.graph.unmuteActor', {
					as: null,
					input: { actor: did },
				}),
			);
		},
		onSuccess() {
			void queryClient.invalidateQueries({ queryKey: RQKEY_MY_MUTED() });
		},
	});
}
