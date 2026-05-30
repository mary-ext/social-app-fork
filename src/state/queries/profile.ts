import { useCallback } from 'react';
import {
	type AppBskyActorDefs,
	type AppBskyActorGetProfiles,
	type AppBskyActorProfile,
	type AppBskyGraphGetFollows,
} from '@atcute/bluesky';
import { type Client, ClientResponseError, ok } from '@atcute/client';
import { type ActorIdentifier, type Did, type ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import {
	type InfiniteData,
	keepPreviousData,
	type QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { createRecord, deleteRecord, getRecord, putRecord } from '#/lib/api/records';
import { uploadBlob } from '#/lib/api/upload-blob';
import { retry } from '#/lib/async/retry';
import { until } from '#/lib/async/until';
import { useToggleMutationQueue } from '#/lib/hooks/useToggleMutationQueue';

import { updateProfileShadow } from '#/state/cache/profile-shadow';
import { type Shadow } from '#/state/cache/types';
import { type ImageMeta } from '#/state/gallery';
import { STALE } from '#/state/queries';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { RQKEY as PROFILE_FOLLOWS_RQKEY } from '#/state/queries/profile-follows';
import {
	unstableCacheProfileView,
	useUnstableProfileViewCache,
} from '#/state/queries/unstable-profile-cache';
import { useUpdateProfileVerificationCache } from '#/state/queries/verification/useUpdateProfileVerificationCache';
import { useClients, useSession } from '#/state/session';
import * as userActionHistory from '#/state/userActionHistory';

import type * as bsky from '#/types/bsky';

import { RQKEY_ROOT as RQKEY_LIST_CONVOS } from './messages/list-conversations';
import { RQKEY as RQKEY_MY_BLOCKED } from './my-blocked-accounts';
import { RQKEY as RQKEY_MY_MUTED } from './my-muted-accounts';

export * from '#/state/queries/unstable-profile-cache';
/** @deprecated use {@link unstableCacheProfileView} instead */
export const precacheProfile = unstableCacheProfileView;

const RQKEY_ROOT = 'profile';
export const RQKEY = (did: string) => [RQKEY_ROOT, did];

export const profilesQueryKeyRoot = 'profiles';
export const profilesQueryKey = (handles: string[]) => [profilesQueryKeyRoot, handles];

export type ProfileFollowLogContext =
	| 'RecommendedFollowsItem'
	| 'PostThreadItem'
	| 'ProfileCard'
	| 'ProfileHeader'
	| 'ProfileHeaderSuggestedFollows'
	| 'ProfileMenu'
	| 'ProfileHoverCard'
	| 'AvatarButton'
	| 'StarterPackProfilesList'
	| 'FeedInterstitial'
	| 'SuggestedFollowsDialog'
	| 'ImmersiveVideo'
	| 'ExploreSuggestedAccounts'
	| 'GroupChat';

export type ProfileUnfollowLogContext = ProfileFollowLogContext | 'Chat';

export function useProfileQuery({
	did,
	staleTime = STALE.SECONDS.FIFTEEN,
}: {
	did: string | undefined;
	staleTime?: number;
}) {
	const { appview } = useClients();
	const { getUnstableProfile } = useUnstableProfileViewCache();
	return useQuery<AppBskyActorDefs.ProfileViewDetailed>({
		// WARNING
		// this staleTime is load-bearing
		// if you remove it, the UI infinite-loops
		// -prf
		staleTime,
		refetchOnWindowFocus: true,
		queryKey: RQKEY(did ?? ''),
		queryFn: () =>
			ok(
				appview.get('app.bsky.actor.getProfile', {
					params: { actor: (did ?? '') as ActorIdentifier },
				}),
			),
		placeholderData: () => {
			if (!did) return;
			return getUnstableProfile(did) as AppBskyActorDefs.ProfileViewDetailed;
		},
		enabled: !!did,
	});
}

export function useProfilesQuery({ handles, maintainData }: { handles: string[]; maintainData?: boolean }) {
	const { appview } = useClients();
	return useQuery({
		enabled: handles.length > 0,
		staleTime: STALE.MINUTES.FIVE,
		queryKey: profilesQueryKey(handles),
		queryFn: () =>
			ok(
				appview.get('app.bsky.actor.getProfiles', {
					params: { actors: handles as ActorIdentifier[] },
				}),
			),
		placeholderData: maintainData ? keepPreviousData : undefined,
	});
}

export function usePrefetchProfileQuery() {
	const { appview } = useClients();
	const queryClient = useQueryClient();
	const prefetchProfileQuery = useCallback(
		async (did: string) => {
			await queryClient.prefetchQuery({
				staleTime: STALE.SECONDS.THIRTY,
				queryKey: RQKEY(did),
				queryFn: () =>
					ok(
						appview.get('app.bsky.actor.getProfile', {
							params: { actor: (did || '') as ActorIdentifier },
						}),
					),
			});
		},
		[queryClient, appview],
	);
	return prefetchProfileQuery;
}

/**
 * A writable `app.bsky.actor.profile` record without its `$type` — the shape the profile mutators read,
 * mutate, and return. `$type` is reattached when the record is written.
 */
export type ProfileRecordWrite = {
	-readonly [K in keyof Omit<AppBskyActorProfile.Main, '$type'>]: Omit<AppBskyActorProfile.Main, '$type'>[K];
};

interface ProfileUpdateParams {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	updates: ProfileRecordWrite | ((existing: ProfileRecordWrite) => ProfileRecordWrite);
	newUserAvatar?: ImageMeta | undefined | null;
	newUserBanner?: ImageMeta | undefined | null;
	checkCommitted?: (res: AppBskyActorDefs.ProfileViewDetailed) => boolean;
}
export function useProfileUpdateMutation() {
	const queryClient = useQueryClient();
	const { appview, pds } = useClients();
	const updateProfileVerificationCache = useUpdateProfileVerificationCache();
	return useMutation<void, Error, ProfileUpdateParams>({
		mutationFn: async ({ profile, updates, newUserAvatar, newUserBanner, checkCommitted }) => {
			let newUserAvatarPromise: ReturnType<typeof uploadBlob> | undefined;
			if (newUserAvatar) {
				newUserAvatarPromise = uploadBlob(pds!, newUserAvatar.blob, newUserAvatar.blob.type);
			}
			let newUserBannerPromise: ReturnType<typeof uploadBlob> | undefined;
			if (newUserBanner) {
				newUserBannerPromise = uploadBlob(pds!, newUserBanner.blob, newUserBanner.blob.type);
			}
			await upsertProfile(pds!, profile.did as Did, async (existing) => {
				let next: ProfileRecordWrite = existing || {};
				if (typeof updates === 'function') {
					next = updates(next);
				} else {
					next.displayName = updates.displayName || undefined;
					next.description = updates.description || undefined;
					if ('pinnedPost' in updates) {
						next.pinnedPost = updates.pinnedPost;
					}
				}
				if (newUserAvatarPromise) {
					next.avatar = await newUserAvatarPromise;
				} else if (newUserAvatar === null) {
					next.avatar = undefined;
				}
				if (newUserBannerPromise) {
					next.banner = await newUserBannerPromise;
				} else if (newUserBanner === null) {
					next.banner = undefined;
				}
				return next;
			});
			await whenAppViewReady(
				appview,
				profile.did,
				checkCommitted ||
					((res) => {
						if (typeof newUserAvatar !== 'undefined') {
							if (newUserAvatar === null && res.avatar) {
								// url hasn't cleared yet
								return false;
							} else if (res.avatar === profile.avatar) {
								// url hasn't changed yet
								return false;
							}
						}
						if (typeof newUserBanner !== 'undefined') {
							if (newUserBanner === null && res.banner) {
								// url hasn't cleared yet
								return false;
							} else if (res.banner === profile.banner) {
								// url hasn't changed yet
								return false;
							}
						}
						if (typeof updates === 'function') {
							return true;
						}
						return res.displayName === updates.displayName && res.description === updates.description;
					}),
			);
		},
		async onSuccess(_, variables) {
			// invalidate cache
			void queryClient.invalidateQueries({
				queryKey: RQKEY(variables.profile.did),
			});
			void queryClient.invalidateQueries({
				queryKey: [profilesQueryKeyRoot, [variables.profile.did]],
			});
			await updateProfileVerificationCache({ profile: variables.profile });
		},
	});
}

export function useProfileFollowMutationQueue(
	profile: Shadow<bsky.profile.AnyProfileView>,
	logContext: ProfileFollowLogContext,
	position?: number,
	contextProfileDid?: string,
) {
	const { appview } = useClients();
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();
	const did = profile.did;
	const initialFollowingUri = profile.viewer?.following;
	const followMutation = useProfileFollowMutation(logContext, profile, position, contextProfileDid);
	const unfollowMutation = useProfileUnfollowMutation(logContext);

	const queueToggle = useToggleMutationQueue({
		initialState: initialFollowingUri,
		runMutation: async (prevFollowingUri, shouldFollow) => {
			if (shouldFollow) {
				const { uri } = await followMutation.mutateAsync({
					did,
				});
				userActionHistory.follow([did]);
				return uri as ResourceUri;
			} else {
				if (prevFollowingUri) {
					await unfollowMutation.mutateAsync({
						did,
						followUri: prevFollowingUri,
					});
					userActionHistory.unfollow([did]);
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
					if (!old?.pages?.[0]) return old;
					if (finalFollowingUri) {
						// Add the followed profile to the beginning
						const alreadyExists = old.pages[0].follows.some((f) => f.did === profile.did);
						if (alreadyExists) return old;
						return {
							...old,
							pages: [
								{
									...old.pages[0],
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

			if (finalFollowingUri) {
				void ok(
					appview.get('app.bsky.graph.getSuggestedFollowsByActor', {
						params: { actor: did as ActorIdentifier },
					}),
				).then((data) => {
					const dids = data.suggestions
						.filter((a) => !a.viewer?.following)
						.map((a) => a.did)
						.slice(0, 8);
					userActionHistory.followSuggestion(dids);
				});
			}
		},
	});

	const queueFollow = useCallback(() => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			followingUri: 'pending',
		});
		return queueToggle(true);
	}, [queryClient, did, queueToggle]);

	const queueUnfollow = useCallback(() => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			followingUri: undefined,
		});
		return queueToggle(false);
	}, [queryClient, did, queueToggle]);

	return [queueFollow, queueUnfollow] as const;
}

function useProfileFollowMutation(
	_logContext: ProfileFollowLogContext,
	_profile: Shadow<bsky.profile.AnyProfileView>,
	_position?: number,
	_contextProfileDid?: string,
) {
	const { pds } = useClients();
	const { currentAccount } = useSession();

	return useMutation<{ uri: string; cid: string }, Error, { did: string }>({
		mutationFn: async ({ did }) => {
			return await createRecord(pds!, {
				collection: 'app.bsky.graph.follow',
				record: {
					$type: 'app.bsky.graph.follow',
					createdAt: new Date().toISOString(),
					subject: did as Did,
				},
				repo: currentAccount!.did as Did,
			});
		},
	});
}

function useProfileUnfollowMutation(_logContext: ProfileUnfollowLogContext) {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation<void, Error, { did: string; followUri: string }>({
		mutationFn: async ({ followUri }) => {
			await deleteRecord(pds!, {
				collection: 'app.bsky.graph.follow',
				repo: currentAccount!.did as Did,
				rkey: parseCanonicalResourceUri(followUri).rkey,
			});
		},
	});
}

export function useProfileMuteMutationQueue(profile: Shadow<bsky.profile.AnyProfileView>) {
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
		},
	});

	const queueMute = useCallback(() => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			muted: true,
		});
		return queueToggle(true);
	}, [queryClient, did, queueToggle]);

	const queueUnmute = useCallback(() => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			muted: false,
		});
		return queueToggle(false);
	}, [queryClient, did, queueToggle]);

	return [queueMute, queueUnmute] as const;
}

function useProfileMuteMutation() {
	const queryClient = useQueryClient();
	const { appview } = useClients();
	return useMutation<void, Error, { did: string }>({
		mutationFn: async ({ did }) => {
			await ok(
				appview.post('app.bsky.graph.muteActor', {
					as: null,
					input: { actor: did as ActorIdentifier },
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
	const { appview } = useClients();
	return useMutation<void, Error, { did: string }>({
		mutationFn: async ({ did }) => {
			await ok(
				appview.post('app.bsky.graph.unmuteActor', {
					as: null,
					input: { actor: did as ActorIdentifier },
				}),
			);
		},
		onSuccess() {
			void queryClient.invalidateQueries({ queryKey: RQKEY_MY_MUTED() });
		},
	});
}

export function useProfileBlockMutationQueue(profile: Shadow<bsky.profile.AnyProfileView>) {
	const queryClient = useQueryClient();
	const did = profile.did;
	const initialBlockingUri = profile.viewer?.blocking;
	const blockMutation = useProfileBlockMutation();
	const unblockMutation = useProfileUnblockMutation();

	const queueToggle = useToggleMutationQueue({
		initialState: initialBlockingUri,
		runMutation: async (prevBlockUri, shouldFollow) => {
			if (shouldFollow) {
				const { uri } = await blockMutation.mutateAsync({
					did,
				});
				return uri as ResourceUri;
			} else {
				if (prevBlockUri) {
					await unblockMutation.mutateAsync({
						did,
						blockUri: prevBlockUri,
					});
				}
				return undefined;
			}
		},
		onSuccess(finalBlockingUri) {
			// finalize
			updateProfileShadow(queryClient, did, {
				blockingUri: finalBlockingUri,
			});
			void queryClient.invalidateQueries({ queryKey: [RQKEY_LIST_CONVOS] });
		},
	});

	const queueBlock = useCallback(() => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			blockingUri: 'pending',
		});
		return queueToggle(true);
	}, [queryClient, did, queueToggle]);

	const queueUnblock = useCallback(() => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			blockingUri: undefined,
		});
		return queueToggle(false);
	}, [queryClient, did, queueToggle]);

	return [queueBlock, queueUnblock] as const;
}

function useProfileBlockMutation() {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: string; cid: string }, Error, { did: string }>({
		mutationFn: async ({ did }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			return await createRecord(pds!, {
				collection: 'app.bsky.graph.block',
				record: {
					$type: 'app.bsky.graph.block',
					createdAt: new Date().toISOString(),
					subject: did as Did,
				},
				repo: currentAccount.did as Did,
			});
		},
		onSuccess(_, { did }) {
			void queryClient.invalidateQueries({ queryKey: RQKEY_MY_BLOCKED() });
			resetProfilePostsQueries(queryClient, did, 1000);
		},
	});
}

function useProfileUnblockMutation() {
	const { currentAccount } = useSession();
	const { pds } = useClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { did: string; blockUri: string }>({
		mutationFn: async ({ blockUri }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			await deleteRecord(pds!, {
				collection: 'app.bsky.graph.block',
				repo: currentAccount.did as Did,
				rkey: parseCanonicalResourceUri(blockUri).rkey,
			});
		},
		onSuccess(_, { did }) {
			resetProfilePostsQueries(queryClient, did, 1000);
		},
	});
}

/**
 * Reads, merges, and writes the signed-in user's own `app.bsky.actor.profile` record, retrying on a swap
 * conflict (a concurrent profile edit). Mirrors `@atproto/api`'s `BskyAgent.upsertProfile`.
 *
 * @param pds the PDS client.
 * @param did the user's repo DID.
 * @param updateFn maps the existing record (or undefined when none exists) to the record to write.
 */
async function upsertProfile(
	pds: Client,
	did: Did,
	updateFn: (existing: ProfileRecordWrite | undefined) => ProfileRecordWrite | Promise<ProfileRecordWrite>,
): Promise<void> {
	await retry(
		5,
		(e) => e instanceof ClientResponseError && e.error === 'InvalidSwap',
		async () => {
			const existing = await getRecord(pds, {
				collection: 'app.bsky.actor.profile',
				repo: did,
				rkey: 'self',
			}).catch((e) => {
				// a missing record means a brand-new profile; anything else should propagate
				if (e instanceof Error && e.message.includes('Could not locate record:')) {
					return undefined;
				}
				throw e;
			});

			const updated = await updateFn(existing?.value);

			await putRecord(pds, {
				collection: 'app.bsky.actor.profile',
				record: { ...updated, $type: 'app.bsky.actor.profile' },
				repo: did,
				rkey: 'self',
				swapRecord: existing?.cid ?? null,
			});
		},
	);
}

async function whenAppViewReady(
	appview: Client,
	actor: string,
	fn: (res: AppBskyActorDefs.ProfileViewDetailed) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		() => ok(appview.get('app.bsky.actor.getProfile', { params: { actor: actor as ActorIdentifier } })),
	);
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileViewDetailed, void> {
	const profileQueryDatas = queryClient.getQueriesData<AppBskyActorDefs.ProfileViewDetailed>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of profileQueryDatas) {
		if (!queryData) {
			continue;
		}
		if (queryData.did === did) {
			yield queryData;
		}
	}
	const profilesQueryDatas = queryClient.getQueriesData<AppBskyActorGetProfiles.$output>({
		queryKey: [profilesQueryKeyRoot],
	});
	for (const [_queryKey, queryData] of profilesQueryDatas) {
		if (!queryData) {
			continue;
		}
		for (let profile of queryData.profiles) {
			if (profile.did === did) {
				yield profile;
			}
		}
	}
}

export function findProfileQueryData(
	queryClient: QueryClient,
	did: string,
): AppBskyActorDefs.ProfileViewDetailed | undefined {
	return queryClient.getQueryData<AppBskyActorDefs.ProfileViewDetailed>(RQKEY(did));
}
