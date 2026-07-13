import type { AppBskyActorDefs, AppBskyUnspeccedGetSuggestedUsersForDiscover } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { aggregateUserInterests, createBskyTopicsHeader } from '#/lib/api/feed/utils';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useClients } from '#/state/session';

import { logger } from '#/logger';

export type QueryProps = {
	limit?: number;
};

export const getSuggestedUsersForDiscoverQueryKeyRoot = 'unspecced-suggested-users-for-discover';
export const createGetSuggestedUsersForDiscoverQueryKey = (props: { limit?: number }) => [
	getSuggestedUsersForDiscoverQueryKeyRoot,
	props.limit,
];

export function useGetSuggestedUsersForDiscoverQuery(props: QueryProps = {}) {
	const { appview } = useClients();
	const { data: preferences } = usePreferencesQuery();

	return useQuery({
		staleTime: STALE.MINUTES.THREE,
		queryKey: createGetSuggestedUsersForDiscoverQueryKey({ limit: props.limit }),
		queryFn: async () => {
			const contentLangs = getContentLanguages().join(',');
			const userInterests = aggregateUserInterests(preferences);

			const data = await ok(
				appview.get('app.bsky.unspecced.getSuggestedUsersForDiscover', {
					params: { limit: props.limit || 10 },
					headers: {
						...createBskyTopicsHeader(userInterests),
						'Accept-Language': contentLangs,
					},
				}),
			);
			if (!data.recIdStr) {
				logger.debug('getSuggestedUsersForDiscover response missing recIdStr');
			}
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
