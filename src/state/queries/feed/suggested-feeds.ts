import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { createBskyTopicsHeader, serializeUserInterests } from '#/lib/bsky-topics';
import { STALE } from '#/lib/query/const';

import { getContentLanguages } from '#/state/preferences/languages';
import { createGetSuggestedFeedsQueryKey } from '#/state/queries/feed/keys';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { getClients } from '#/state/session';

const DEFAULT_LIMIT = 15;

export function useGetSuggestedFeedsQuery({ enabled }: { enabled?: boolean }) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();
	const savedFeeds = preferences?.savedFeeds;

	return useQuery({
		queryKey: createGetSuggestedFeedsQueryKey(),
		enabled: !!preferences && enabled !== false,
		staleTime: STALE.MINUTES.THREE,
		queryFn: async ({ signal }) => {
			const contentLangs = getContentLanguages().join(',');
			const data = await ok(
				appview.get('app.bsky.unspecced.getSuggestedFeeds', {
					signal,
					headers: {
						...createBskyTopicsHeader(serializeUserInterests(preferences)),
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
