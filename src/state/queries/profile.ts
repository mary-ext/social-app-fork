import type { ComAtprotoRepoStrongRef } from '@atcute/atproto';
import type {
	AnyProfileView,
	AppBskyActorDefs,
	AppBskyActorProfile,
	AppBskyGraphGetFollows,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier, Blob as AtpBlob, Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { mapDefined } from '@mary-ext/array-fns';
import { createBatchedFetch } from '@mary-ext/batch-fetch';

import {
	type InfiniteData,
	type QueryClient,
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
	type UseQueryResult,
} from '@tanstack/react-query';

import { createRecord, deleteRecord, findRecord, uploadBlob } from '#/lib/api/records';
import type { ImageMeta } from '#/lib/media/edit-image';
import { until } from '#/lib/utils/until';

import { updateProfileShadow, useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { registerShadowFinders } from '#/state/cache/registry';
import type { Shadow } from '#/state/cache/types';
import { STALE } from '#/state/queries';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { RQKEY as PROFILE_FOLLOWS_RQKEY } from '#/state/queries/profile-follows';
import { PROFILE_RQKEY_ROOT, profileQueryKey } from '#/state/queries/profile-key';
import { cancelScheduledUnmutes } from '#/state/queries/timed-mutes';
import { useToggleMutationQueue } from '#/state/queries/toggle-mutation-queue';
import { useUnstableProfileViewCache } from '#/state/queries/unstable-profile-cache';
import { getAccountProfileView, getClients, useSession } from '#/state/session';

import { prepareLinkWrites } from '#/features/profile-links/link-writes';
import { sameLinkCids } from '#/features/profile-links/record';
import type { ProfileLink, SavedProfileLink } from '#/features/profile-links/types';
import { useUpdateProfileVerificationCache } from '#/features/verification/use-update-verification-cache';

import { LIST_CONVOS_RQKEY_ROOT } from './messages/list-conversations-key';
import { RQKEY as RQKEY_MY_BLOCKED } from './my-blocked-accounts';
import { RQKEY as RQKEY_MY_MUTED } from './my-muted-accounts';

export * from '#/state/queries/unstable-profile-cache';

export const RQKEY = profileQueryKey;

function getProfilePlaceholder(
	getUnstableProfile: (didOrHandle: string) => AnyProfileView | undefined,
	did: Did | undefined,
): AppBskyActorDefs.ProfileViewDetailed | undefined {
	if (!did) {
		return;
	}
	const placeholder = getUnstableProfile(did) ?? getAccountProfileView(did);
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- consumers gate detailed fields with isPlaceholderData
	return placeholder as AppBskyActorDefs.ProfileViewDetailed | undefined;
}

const fetchProfile = createBatchedFetch<Did, AppBskyActorDefs.ProfileViewDetailed>({
	limit: 25, // getProfiles caps `actors` at 25
	fetch: async (dids, signal) => {
		const { appview } = getClients();
		const { profiles } = await ok(
			appview.get('app.bsky.actor.getProfiles', {
				signal,
				params: { actors: dids },
			}),
		);
		return profiles;
	},
	idFromResource: (profile) => profile.did,
});

export function useProfileQuery({
	batch = false,
	did,
	staleTime = STALE.SECONDS.FIFTEEN,
}: {
	batch?: boolean;
	did: Did | undefined;
	staleTime?: number;
}) {
	const { appview } = getClients();
	const { getUnstableProfile } = useUnstableProfileViewCache();
	return useQuery<AppBskyActorDefs.ProfileViewDetailed>({
		queryKey: RQKEY(did ?? ''),
		enabled: !!did,
		// this stale time prevents a refetch loop.
		staleTime,
		refetchOnWindowFocus: true,
		queryFn: ({ signal }) =>
			batch
				? fetchProfile(did!, signal)
				: ok(
						appview.get('app.bsky.actor.getProfile', {
							signal,
							params: { actor: did! },
						}),
					),
		placeholderData: () => getProfilePlaceholder(getUnstableProfile, did),
	});
}
export function useCurrentAccountProfile() {
	const { currentAccount } = useSession();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	return useMaybeProfileShadow(profile);
}

// hoisted for a stable reference so react-query memoizes the combined result across renders.
const combineProfiles = (results: UseQueryResult<AppBskyActorDefs.ProfileViewDetailed>[]) => ({
	data: { profiles: mapDefined(results, (r) => r.data) },
	isLoading: results.some((r) => r.isLoading),
	isPending: results.some((r) => r.isPending),
});

export function useProfilesQuery({ dids }: { dids: Did[] }) {
	const { getUnstableProfile } = useUnstableProfileViewCache();
	return useQueries({
		queries: dids.map((did) => ({
			enabled: !!did,
			staleTime: STALE.MINUTES.FIVE,
			queryKey: RQKEY(did),
			queryFn: ({ signal }: { signal: AbortSignal }) => fetchProfile(did, signal),
			placeholderData: () => getProfilePlaceholder(getUnstableProfile, did),
		})),
		// each did is its own cache entry, so changing the `dids` set never blanks the already-resolved ones.
		combine: combineProfiles,
	});
}

export function usePrefetchProfileQuery() {
	const queryClient = useQueryClient();
	const prefetchProfileQuery = async (did: Did) => {
		await queryClient.prefetchQuery({
			staleTime: STALE.SECONDS.THIRTY,
			queryKey: RQKEY(did),
			queryFn: ({ signal }) => fetchProfile(did, signal),
		});
	};
	return prefetchProfileQuery;
}

type ProfileRecordWrite = {
	-readonly [K in keyof Omit<AppBskyActorProfile.Main, '$type'>]: Omit<AppBskyActorProfile.Main, '$type'>[K];
};

export type ProfileImageEdit = { kind: 'remove' } | { kind: 'replace'; image: ImageMeta };

/** profile edits; omitted fields are unchanged, empty strings clear text fields. */
export type ProfileEdits = {
	avatar?: ProfileImageEdit;
	banner?: ProfileImageEdit;
	description?: string;
	displayName?: string;
	/** the links as loaded and as they should be saved. */
	links?: { existing: SavedProfileLink[]; next: ProfileLink[] };
	/** `null` unpins the current post. */
	pinnedPost?: ComAtprotoRepoStrongRef.Main | null;
	/** a self-label to add or remove, leaving other self-labels intact. */
	selfLabel?: { enabled: boolean; value: string };
};

const uploadImageEdit = async (pds: Client, edit: ProfileImageEdit): Promise<AtpBlob | undefined> => {
	switch (edit.kind) {
		case 'remove': {
			return undefined;
		}
		case 'replace': {
			return uploadBlob(pds, edit.image.blob, edit.image.blob.type);
		}
	}
};

const withSelfLabel = (
	labels: ProfileRecordWrite['labels'],
	{ enabled, value }: { enabled: boolean; value: string },
): ProfileRecordWrite['labels'] => {
	const values =
		labels?.$type === 'com.atproto.label.defs#selfLabels'
			? labels.values.filter((label) => label.val !== value)
			: [];
	if (enabled) {
		values.push({ val: value });
	}
	return values.length > 0 ? { $type: 'com.atproto.label.defs#selfLabels', values } : undefined;
};

const imageEditCommitted = (
	edit: ProfileImageEdit | undefined,
	current: string | undefined,
	fresh: string | undefined,
): boolean => {
	switch (edit?.kind) {
		case undefined: {
			return true;
		}
		case 'remove': {
			return !fresh;
		}
		case 'replace': {
			return fresh !== current;
		}
	}
};

const editsCommitted = ({
	edits,
	fresh,
	linkRefs,
	profile,
}: {
	edits: ProfileEdits;
	fresh: AppBskyActorDefs.ProfileViewDetailed;
	linkRefs: ComAtprotoRepoStrongRef.Main[] | undefined;
	/** the profile view the edits were made against. */
	profile: AppBskyActorDefs.ProfileViewDetailed;
}): boolean => {
	if (!imageEditCommitted(edits.avatar, profile.avatar, fresh.avatar)) {
		return false;
	}
	if (!imageEditCommitted(edits.banner, profile.banner, fresh.banner)) {
		return false;
	}
	if (edits.description !== undefined && (fresh.description ?? '') !== edits.description) {
		return false;
	}
	if (edits.displayName !== undefined && (fresh.displayName ?? '') !== edits.displayName) {
		return false;
	}
	if (linkRefs && !sameLinkCids(fresh.links, linkRefs)) {
		return false;
	}
	if (edits.pinnedPost !== undefined && fresh.pinnedPost?.uri !== edits.pinnedPost?.uri) {
		return false;
	}
	if (edits.selfLabel) {
		const { enabled, value } = edits.selfLabel;
		const labeled = !!fresh.labels?.some((label) => label.val === value && label.src === profile.did);
		if (labeled !== enabled) {
			return false;
		}
	}
	return true;
};

/**
 * saves profile and link edits atomically, then polls the AppView until they appear or polling expires.
 *
 * @returns the mutation, taking the profile being edited and the edits to apply
 */
export function useProfileUpdateMutation() {
	const queryClient = useQueryClient();
	const { appview, pds } = getClients();
	const updateProfileVerificationCache = useUpdateProfileVerificationCache();
	return useMutation<void, Error, { edits: ProfileEdits; profile: AppBskyActorDefs.ProfileViewDetailed }>({
		mutationFn: async ({ edits, profile }) => {
			if (!pds) {
				throw new Error(`not signed in`);
			}

			const [existing, avatar, banner, links] = await Promise.all([
				findRecord(pds, { repo: profile.did, collection: 'app.bsky.actor.profile', rkey: 'self' }),
				edits.avatar && uploadImageEdit(pds, edits.avatar),
				edits.banner && uploadImageEdit(pds, edits.banner),
				edits.links && prepareLinkWrites(pds, profile.did, edits.links),
			]);

			const next: ProfileRecordWrite = { ...existing?.value };
			if (edits.avatar) {
				next.avatar = avatar;
			}
			if (edits.banner) {
				next.banner = banner;
			}
			if (edits.description !== undefined) {
				next.description = edits.description || undefined;
			}
			if (edits.displayName !== undefined) {
				next.displayName = edits.displayName || undefined;
			}
			if (links) {
				next.links = links.refs.length > 0 ? links.refs : undefined;
			}
			if (edits.pinnedPost !== undefined) {
				next.pinnedPost = edits.pinnedPost ?? undefined;
			}
			if (edits.selfLabel) {
				next.labels = withSelfLabel(next.labels, edits.selfLabel);
			}

			await ok(
				pds.post('com.atproto.repo.applyWrites', {
					input: {
						repo: profile.did,
						writes: [
							...(links?.writes ?? []),
							{
								$type: existing
									? 'com.atproto.repo.applyWrites#update'
									: 'com.atproto.repo.applyWrites#create',
								collection: 'app.bsky.actor.profile',
								rkey: 'self',
								value: { $type: 'app.bsky.actor.profile', ...next } satisfies AppBskyActorProfile.Main,
							},
						],
					},
				}),
			);

			await whenAppViewReady(appview, profile.did, (fresh) => {
				return editsCommitted({ edits, fresh, linkRefs: links?.refs, profile });
			});
		},
		async onSuccess(_, variables) {
			// invalidate cache
			void queryClient.invalidateQueries({
				queryKey: RQKEY(variables.profile.did),
			});
			await updateProfileVerificationCache({ profile: variables.profile });
		},
	});
}

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

export function useProfileBlockMutationQueue(profile: Shadow<AnyProfileView>) {
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
				return uri;
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
			// the shadow only reaches components that read profiles through shadow
			// hooks. the convo list is also read raw (e.g. the unread badge's
			// calculateCount, getMessageInfo), and blocks emit no chat log event,
			// so without a refetch that data stays stale indefinitely.
			void queryClient.invalidateQueries({ queryKey: [LIST_CONVOS_RQKEY_ROOT] });
		},
	});

	const queueBlock = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			blockingUri: 'pending',
		});
		return queueToggle(true);
	};

	const queueUnblock = () => {
		// optimistically update
		updateProfileShadow(queryClient, did, {
			blockingUri: undefined,
		});
		return queueToggle(false);
	};

	return [queueBlock, queueUnblock] as const;
}

function useProfileBlockMutation() {
	const { currentAccount } = useSession();
	const { pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: ResourceUri; cid: string }, Error, { did: Did }>({
		mutationFn: async ({ did }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			return await createRecord(pds!, {
				repo: currentAccount.did,
				record: {
					$type: 'app.bsky.graph.block',
					createdAt: new Date().toISOString(),
					subject: did,
				},
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
	const { pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<void, Error, { did: Did; blockUri: string }>({
		mutationFn: async ({ blockUri }) => {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			await deleteRecord(pds!, {
				repo: currentAccount.did,
				collection: 'app.bsky.graph.block',
				rkey: parseCanonicalResourceUri(blockUri).rkey,
			});
		},
		onSuccess(_, { did }) {
			resetProfilePostsQueries(queryClient, did, 1000);
		},
	});
}

async function whenAppViewReady(
	appview: Client,
	actor: ActorIdentifier,
	fn: (res: AppBskyActorDefs.ProfileViewDetailed) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		(res) => res !== undefined && fn(res),
		() => ok(appview.get('app.bsky.actor.getProfile', { params: { actor } })),
	);
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileViewDetailed, void> {
	const profileQueryDatas = queryClient.getQueriesData<AppBskyActorDefs.ProfileViewDetailed>({
		queryKey: [PROFILE_RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of profileQueryDatas) {
		if (!queryData) {
			continue;
		}
		if (queryData.did === did) {
			yield queryData;
		}
	}
}

registerShadowFinders(PROFILE_RQKEY_ROOT, {
	findProfiles: findAllProfilesInQueryData,
});
