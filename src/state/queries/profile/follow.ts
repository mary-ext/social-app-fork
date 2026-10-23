import type { AnyProfileView, AppBskyActorDefs, AppBskyGraphGetFollows } from '@atcute/bluesky';
import type { Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';
import { useToggleMutationQueue } from '#/lib/query/toggle-mutation-queue';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import type { Shadow } from '#/state/cache/types';
import { PROFILE_FOLLOWS_RQKEY } from '#/state/queries/profile/keys';
import { getClients, useSession } from '#/state/session';

export function useProfileFollowMutationQueue(profile: Shadow<AnyProfileView>) {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const did = profile.did;
	const initialFollowingUri = profile.viewer?.following;
	const followMutation = useProfileFollowMutation();
	const unfollowMutation = useProfileUnfollowMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialFollowingUri,
		runMutation: async (prevFollowingUri, shouldFollow) => {
			if (shouldFollow) {
				const { uri } = await followMutation.mutateAsync({
					did,
				});
				return uri;
			} else {
				if (prevFollowingUri) {
					await unfollowMutation.mutateAsync({
						did,
						followUri: prevFollowingUri,
					});
				}
				return undefined;
			}
		},
		onSuccess(finalFollowingUri) {
			// finalize
			updateProfileShadow(queryClient, did, {
				followingUri: finalFollowingUri,
			});

			// Optimistically update profile follows cache for avatar displays
			if (currentAccount?.did) {
				type FollowsQueryData = InfiniteData<AppBskyGraphGetFollows.$output>;
				queryClient.setQueryData<FollowsQueryData>(PROFILE_FOLLOWS_RQKEY(currentAccount.did), (old) => {
					if (!old?.pages?.[0]) {
						return old;
					}
					if (finalFollowingUri) {
						// Add the followed profile to the beginning
						const alreadyExists = old.pages[0].follows.some((f) => f.did === profile.did);
						if (alreadyExists) {
							return old;
						}
						return {
							...old,
							pages: [
								{
									...old.pages[0],
									// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every `AnyProfileView` member carries these fields; only `$type` differs
									follows: [profile as AppBskyActorDefs.ProfileView, ...old.pages[0].follows],
								},
								...old.pages.slice(1),
							],
						};
					} else {
						// Remove the unfollowed profile
						return {
							...old,
							pages: old.pages.map((page) => ({
								...page,
								follows: page.follows.filter((f) => f.did !== profile.did),
							})),
						};
					}
				});
			}
		},
	});

	const queueFollow = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			followingUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnfollow = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			followingUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueFollow, queueUnfollow] as const;
}

function useProfileFollowMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();

	return useMutation<{ uri: ResourceUri; cid: string }, Error, { did: Did }>({
		mutationFn: async ({ did }) => {
			return await createRecord(pds!, {
				repo: currentAccount!.did,
				record: {
					$type: 'app.bsky.graph.follow',
					createdAt: new Date().toISOString(),
					subject: did,
				},
			});
		},
	});
}

function useProfileUnfollowMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { did: Did; followUri: string }>({
		mutationFn: async ({ followUri }) => {
			await deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.graph.follow',
				rkey: parseCanonicalResourceUri(followUri).rkey,
			});
		},
	});
}
