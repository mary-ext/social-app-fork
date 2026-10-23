import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { RQKEY } from '#/state/queries/list/keys';
import { whenAppViewReady } from '#/state/queries/list/lib/when-app-view-ready';
import { getClients } from '#/state/session';

export function useListMuteMutation() {
	const queryClient = useQueryClient();
	const { appview } = getClients();
	return useMutation<void, Error, { uri: ResourceUri; mute: boolean }>({
		mutationFn: async ({ uri, mute }) => {
			await ok(
				appview.post(mute ? 'app.bsky.graph.muteActorList' : 'app.bsky.graph.unmuteActorList', {
					as: null,
					input: { list: uri },
				}),
			);

			await whenAppViewReady(appview, uri, (v) => {
				return !!v?.viewer?.muted === mute;
			});
		},
		onSuccess(_data, variables) {
			void queryClient.invalidateQueries({
				queryKey: RQKEY(variables.uri),
			});
		},
	});
}
