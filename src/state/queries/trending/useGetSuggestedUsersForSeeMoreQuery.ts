import type { AppBskyActorDefs, AppBskyUnspeccedGetSuggestedUsersForSeeMore } from '@atcute/bluesky';
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
	enabled?: boolean;
};

export const getSuggestedUsersForSeeMoreQueryKeyRoot = 'unspecced-suggested-users-for-see-more';
export const createGetSuggestedUsersForSeeMoreQueryKey = (props: {
	category?: string | null;
	limit?: number;
}) => [getSuggestedUsersForSeeMoreQueryKeyRoot, props.category, props.limit];

export function useGetSuggestedUsersForSeeMoreQuery(props: QueryProps = {}) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();

	return useQuery({
		queryKey: createGetSuggestedUsersForSeeMoreQueryKey({
			category: props.category,
			limit: props.limit,
		}),
		enabled: props.enabled ?? true,
		staleTime: STALE.MINUTES.THREE,
		queryFn: async () => {
			const contentLangs = getContentLanguages().join(',');
			const userInterests = joinInterestTags(preferences);

			const data = await ok(
				appview.get('app.bsky.unspecced.getSuggestedUsersForSeeMore', {
					headers: {
						...createBskyTopicsHeader(userInterests),
						'Accept-Language': contentLangs,
					},
					params: {
						category: props.category ?? undefined,
						limit: props.limit || 50,
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
	const responses = queryClient.getQueriesData<AppBskyUnspeccedGetSuggestedUsersForSeeMore.$output>({
		queryKey: [getSuggestedUsersForSeeMoreQueryKeyRoot],
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

registerShadowFinders(getSuggestedUsersForSeeMoreQueryKeyRoot, {
	findProfiles: findAllProfilesInQueryData,
});
