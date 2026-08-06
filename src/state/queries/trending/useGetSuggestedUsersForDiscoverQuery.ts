import type { AppBskyActorDefs, AppBskyUnspeccedGetSuggestedUsersForDiscover } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { aggregateUserInterests, createBskyTopicsHeader } from '#/state/queries/feed-api/utils';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

export type QueryProps = {
	limit?: number;
};

export const getSuggestedUsersForDiscoverQueryKeyRoot = 'unspecced-suggested-users-for-discover';
export const createGetSuggestedUsersForDiscoverQueryKey = (props: { limit?: number }) => [
	getSuggestedUsersForDiscoverQueryKeyRoot,
	props.limit,
];

export function useGetSuggestedUsersForDiscoverQuery(props: QueryProps = {}) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();

	return useQuery({
		queryKey: createGetSuggestedUsersForDiscoverQueryKey({ limit: props.limit }),
		staleTime: STALE.MINUTES.THREE,
		queryFn: async () => {
			const contentLangs = getContentLanguages().join(',');
			const userInterests = aggregateUserInterests(preferences);

			const data = await ok(
				appview.get('app.bsky.unspecced.getSuggestedUsersForDiscover', {
					headers: {
						...createBskyTopicsHeader(userInterests),
						'Accept-Language': contentLangs,
					},
					params: { limit: props.limit || 10 },
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
	const responses = queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForDiscover.$output>({
		queryKey: [getSuggestedUsersForDiscoverQueryKeyRoot],
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

registerShadowFinders(getSuggestedUsersForDiscoverQueryKeyRoot, {
	findProfiles: findAllProfilesInQueryData,
});
