import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useReferenceListOptOutMutation } from '#/state/queries/list/opt-out';
import { RQKEY } from '#/state/queries/starter-pack/cache';
import { getClients } from '#/state/session';

/**
 * toggles the viewer's starter pack opt-out with an optimistic cache update.
 *
 * @param starterPack the starter pack; toggling fails when it has no list.
 * @returns a mutation taking the viewer's current opt-out, if any.
 */
export function useStarterPackOptOutMutation(starterPack: AppBskyGraphDefs.StarterPackView) {
	const { appview } = getClients();

	return useReferenceListOptOutMutation<AppBskyGraphDefs.StarterPackView>({
		fetchView: async () => {
			const data = await ok(
				appview.get('app.bsky.graph.getStarterPack', { params: { starterPack: starterPack.uri } }),
			);
			return data.starterPack;
		},
		getOptOut: (view) => view.list?.viewer?.referenceListOptOut,
		listUri: starterPack.list?.uri,
		queryKey: RQKEY({ uri: starterPack.uri }),
		setOptOut: (view, optOut) => {
			if (!view.list) {
				return view;
			}
			return {
				...view,
				list: { ...view.list, viewer: { ...view.list.viewer, referenceListOptOut: optOut } },
			};
		},
	});
}
