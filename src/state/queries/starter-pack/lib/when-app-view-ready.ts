import type { AppBskyGraphGetStarterPack } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { until } from '#/lib/utils/until';

/**
 * polls the appview's starter pack view until it satisfies a predicate, or gives up after 5 tries.
 *
 * @param appview the appview client
 * @param uri the starter pack to poll
 * @param fn checks the fetched response; it's undefined when the fetch failed
 */
export async function whenAppViewReady(
	appview: Client,
	uri: ResourceUri,
	fn: (res: AppBskyGraphGetStarterPack.$output | undefined) => boolean,
) {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		fn,
		() => ok(appview.get('app.bsky.graph.getStarterPack', { params: { starterPack: uri } })),
	);
}
