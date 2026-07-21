import type {
	AppBskyActorDefs,
	AppBskyActorGetSuggestions,
	AppBskyGraphGetSuggestedFollowsByActor,
} from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

const suggestedFollowsQueryKeyRoot = 'suggested-follows';

const suggestedFollowsByActorQueryKeyRoot = 'suggested-follows-by-actor';
export const suggestedFollowsByActorQueryKey = (did: string) => [suggestedFollowsByActorQueryKeyRoot, did];

export function useSuggestedFollowsByActorQuery({
	did,
	enabled,
	staleTime = STALE.MINUTES.FIVE,
}: {
	did: Did;
	enabled?: boolean;
	staleTime?: number;
}) {
	const { appview } = useClients();
	return useQuery({
		staleTime,
		queryKey: suggestedFollowsByActorQueryKey(did),
		queryFn: async () => {
			const data = await ok(
				appview.get('app.bsky.graph.getSuggestedFollowsByActor', {
					params: { actor: did },
				}),
			);
			const suggestions = data.suggestions.filter((profile) => !profile.viewer?.following);
			return { suggestions };
		},
		enabled,
	});
}

export function useSuggestedFollowsByActorWithDismiss({
	did,
	enabled,
	staleTime,
}: {
	did: Did;
	enabled?: boolean;
	staleTime?: number;
}) {
	const { isLoading, data, error } = useSuggestedFollowsByActorQuery({
		did,
		enabled,
		staleTime,
	});
	const queryClient = useQueryClient();

	const onDismiss = (dismissedDid: string) => {
		queryClient.setQueryData(suggestedFollowsByActorQueryKey(did), (previous: typeof data) => {
			if (!previous) {
				return previous;
			}
			return {
				...previous,
				suggestions: previous.suggestions.filter((s) => s.did !== dismissedDid),
			};
		});
	};

	const profiles = data?.suggestions ?? [];

	return {
		profiles,
		onDismiss,
		isLoading,
		error,
	};
}

export function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	yield* findAllProfilesInSuggestedFollowsQueryData(queryClient, did);
	yield* findAllProfilesInSuggestedFollowsByActorQueryData(queryClient, did);
}

function* findAllProfilesInSuggestedFollowsQueryData(queryClient: QueryClient, did: string) {
	const queryDatas = queryClient.getQueriesData<InfiniteData<AppBskyActorGetSuggestions.$output>>({
		queryKey: [suggestedFollowsQueryKeyRoot],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const actor of page.actors) {
				if (actor.did === did) {
					yield actor;
				}
			}
		}
	}
}

function* findAllProfilesInSuggestedFollowsByActorQueryData(queryClient: QueryClient, did: string) {
	const queryDatas = queryClient.getQueriesData<AppBskyGraphGetSuggestedFollowsByActor.$output>({
		queryKey: [suggestedFollowsByActorQueryKeyRoot],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData) {
			continue;
		}
		for (const suggestion of queryData.suggestions) {
			if (suggestion.did === did) {
				yield suggestion;
			}
		}
	}
}

registerShadowFinders(suggestedFollowsQueryKeyRoot, {
	findProfiles: findAllProfilesInQueryData,
});
