import type { AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';

import type { QueryClient } from '@tanstack/react-query';

import { getStarterPackRecord } from '#/lib/api/record-casts';
import { parseStarterPackUri } from '#/lib/starter-pack';

const RQKEY_ROOT = 'starter-pack';

/**
 * builds the query key for a single starter pack.
 *
 * @param target either a starter pack URI (`at://` or `https://`) or its creator DID and record key
 * @returns the query key
 */
export const RQKEY = ({ uri, did, rkey }: { uri?: string; did?: string; rkey?: string }) => {
	if (uri?.startsWith('https://') || uri?.startsWith('at://')) {
		const parsed = parseStarterPackUri(uri);
		return [RQKEY_ROOT, parsed?.actor, parsed?.rkey];
	} else {
		return [RQKEY_ROOT, did, rkey];
	}
};

/**
 * caches a starter pack view for subsequent detail requests.
 *
 * @param queryClient the query client
 * @param starterPack the starter pack view to seed from
 */
export function precacheStarterPack(
	queryClient: QueryClient,
	starterPack: AppBskyGraphDefs.StarterPackViewBasic | AppBskyGraphDefs.StarterPackView,
) {
	const record = getStarterPackRecord(starterPack);
	if (record.$type !== 'app.bsky.graph.starterpack') {
		return;
	}

	let starterPackView: AppBskyGraphDefs.StarterPackView | undefined;
	if (starterPack.$type === 'app.bsky.graph.defs#starterPackView') {
		starterPackView = starterPack;
	} else if (starterPack.$type === 'app.bsky.graph.defs#starterPackViewBasic') {
		// the appview returns generator views despite the lexicon's broader field type.
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the wire shape disagrees with the lexicon, see above
		const feeds = record.feeds as unknown as AppBskyFeedDefs.GeneratorView[] | undefined;

		const listView: AppBskyGraphDefs.ListViewBasic = {
			cid: '',
			name: record.name,
			purpose: 'app.bsky.graph.defs#referencelist',
			uri: record.list,
		};
		starterPackView = {
			...starterPack,
			$type: 'app.bsky.graph.defs#starterPackView',
			feeds,
			list: listView,
		};
	}

	if (starterPackView) {
		queryClient.setQueryData(RQKEY({ uri: starterPack.uri }), starterPackView);
	}
}
