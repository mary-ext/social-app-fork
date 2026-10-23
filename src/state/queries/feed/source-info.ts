import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import {
	type FeedSourceInfo,
	getFeedTypeFromUri,
	hydrateFeedGenerator,
	hydrateList,
} from '#/lib/feeds/source-info';
import { STALE } from '#/lib/query/const';

import { feedSourceInfoQueryKey } from '#/state/queries/feed/keys';
import { getClients } from '#/state/session';

export function useFeedSourceInfoQuery({ uri }: { uri: string | undefined }) {
	const { appview } = getClients();

	return useQuery({
		queryKey: feedSourceInfoQueryKey({ uri: uri ?? '' }),
		staleTime: STALE.INFINITY,
		enabled: !!uri,
		queryFn: async ({ signal }) => {
			// `enabled` gates the query on `uri`, so this only fires if that gate is ever removed
			if (!uri) {
				throw new Error('getFeedSourceInfo: query ran without a uri');
			}

			let view: FeedSourceInfo;

			if (getFeedTypeFromUri(uri) === 'feed') {
				const data = await ok(
					appview.get('app.bsky.feed.getFeedGenerator', {
						signal,
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `FeedSourceInfo.uri` widens to `string` only for the Following pseudo-feed
						params: { feed: uri as ResourceUri },
					}),
				);
				view = hydrateFeedGenerator(data.view);
			} else {
				const data = await ok(
					appview.get('app.bsky.graph.getList', {
						signal,
						// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `FeedSourceInfo.uri` widens to `string` only for the Following pseudo-feed
						params: { list: uri as ResourceUri, limit: 1 },
					}),
				);
				view = hydrateList(data.list);
			}

			return view;
		},
	});
}
