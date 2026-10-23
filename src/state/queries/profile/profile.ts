import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { mapDefined } from '@mary-ext/array-fns';
import { createBatchedFetch } from '@mary-ext/batch-fetch';

import {
	type QueryClient,
	useQueries,
	useQuery,
	useQueryClient,
	type UseQueryResult,
} from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { registerShadowFinders } from '#/state/cache/registry';
import { PROFILE_RQKEY_ROOT, profileQueryKey } from '#/state/queries/profile/keys';
import { useUnstableProfileViewCache } from '#/state/queries/profile/unstable-cache';
import { getAccountProfileView, getClients, useSession } from '#/state/session';

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
		queryKey: profileQueryKey(did ?? ''),
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
			queryKey: profileQueryKey(did),
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
			queryKey: profileQueryKey(did),
			queryFn: ({ signal }) => fetchProfile(did, signal),
		});
	};
	return prefetchProfileQuery;
}

function* findAllProfilesInQueryData(
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
