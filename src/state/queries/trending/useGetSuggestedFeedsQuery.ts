import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { aggregateUserInterests, createBskyTopicsHeader } from '#/state/queries/feed-api/utils';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

export const DEFAULT_LIMIT = 15;

export const createGetSuggestedFeedsQueryKey = () => ['suggested-feeds'];

export function useGetSuggestedFeedsQuery({ enabled }: { enabled?: boolean }) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();
	const savedFeeds = preferences?.savedFeeds;

	return useQuery({
		queryKey: createGetSuggestedFeedsQueryKey(),
		enabled: !!preferences && enabled !== false,
		staleTime: STALE.MINUTES.THREE,
		queryFn: async () => {
			const contentLangs = getContentLanguages().join(',');
			const data = await ok(
				appview.get('app.bsky.unspecced.getSuggestedFeeds', {
					headers: {
						...createBskyTopicsHeader(aggregateUserInterests(preferences)),
						'Accept-Language': contentLangs,
					},
					params: { limit: DEFAULT_LIMIT },
				}),
			);

			return {
				feeds: data.feeds.filter((feed) => {
					const isSaved = !!savedFeeds?.find((s) => s.value === feed.uri);
					return !isSaved;
				}),
			};
		},
	});
}
