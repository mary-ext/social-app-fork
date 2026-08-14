import type { AppBskyActorDefs, AppBskyUnspeccedGetSuggestedUsersForExplore } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { joinInterestTags, createBskyTopicsHeader } from '#/state/queries/feed-api/utils';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

export type QueryProps = {
	category?: string | null;
	limit?: number;
};

export const getSuggestedUsersForExploreQueryKeyRoot = 'unspecced-suggested-users-for-explore';
export const createGetSuggestedUsersForExploreQueryKey = (props: QueryProps) => [
	getSuggestedUsersForExploreQueryKeyRoot,
	props.category,
	props.limit,
];

export function useGetSuggestedUsersForExploreQuery(props: QueryProps = {}) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();

	return useQuery({
		queryKey: createGetSuggestedUsersForExploreQueryKey(props),
		staleTime: STALE.MINUTES.THREE,
		queryFn: async ({ signal }) => {
			const contentLangs = getContentLanguages().join(',');
			const userInterests = joinInterestTags(preferences);

			const data = await ok(
				appview.get('app.bsky.unspecced.getSuggestedUsersForExplore', {
					signal,
					headers: {
						...createBskyTopicsHeader(userInterests),
						'Accept-Language': contentLangs,
					},
					params: {
						category: props.category ?? undefined,
						limit: props.limit || 10,
					},
				}),
			);

			return { ...data, recId: data.recIdStr };
		},
	});
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const responses = queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForExplore.$output>({
		queryKey: [getSuggestedUsersForExploreQueryKeyRoot],
	});
	for (const [_key, response] of responses) {
		if (!response) {
			continue;
		}

		for (const actor of response.actors) {
			if (actor.did === did) {
				yield actor;
			}
		}
	}
}

registerShadowFinders(getSuggestedUsersForExploreQueryKeyRoot, {
	findProfiles: findAllProfilesInQueryData,
});
