import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { until } from '#/lib/utils/until';

/**
 * polls the appview's list view until it satisfies a predicate, or gives up after 5 tries.
 *
 * @param appview the appview client
 * @param uri the list to poll
 * @param fn checks the fetched list view; it's undefined when the fetch failed
 */
export async function whenAppViewReady(
	appview: Client,
	uri: ResourceUri,
	fn: (v: AppBskyGraphDefs.ListView | undefined) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		async () => {
			const data = await ok(
				appview.get('app.bsky.graph.getList', {
					params: { limit: 1, list: uri },
				}),
			);
			return data.list;
		},
	);
}
