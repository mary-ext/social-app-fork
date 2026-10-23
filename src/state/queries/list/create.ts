import type { AppBskyGraphList, AppBskyRichtextFacet } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createRecord, uploadBlob } from '#/lib/api/records';
import type { ImageMeta } from '#/lib/media/edit-image';

import { invalidateMyLists } from '#/state/queries/list/cache';
import { whenAppViewReady } from '#/state/queries/list/lib/when-app-view-ready';
import { PROFILE_LISTS_RQKEY } from '#/state/queries/profile/keys';
import { getClients, useSession } from '#/state/session';

export interface ListCreateMutateParams {
	purpose: string;
	name: string;
	description: string;
	descriptionFacets: AppBskyRichtextFacet.Main[] | undefined;
	avatar: ImageMeta | null | undefined;
}
export function useListCreateMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: ResourceUri; cid: string }, Error, ListCreateMutateParams>({
		async mutationFn({ purpose, name, description, descriptionFacets, avatar }) {
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (purpose !== 'app.bsky.graph.defs#curatelist' && purpose !== 'app.bsky.graph.defs#modlist') {
				throw new Error('Invalid list purpose: must be curatelist or modlist');
			}
			const record: AppBskyGraphList.Main = {
				$type: 'app.bsky.graph.list',
				avatar: undefined,
				createdAt: new Date().toISOString(),
				description,
				descriptionFacets,
				name,
				purpose,
			};
			if (avatar) {
				record.avatar = await uploadBlob(pds!, avatar.blob);
			}
			const res = await createRecord(pds!, {
				repo: currentAccount.did,
				record,
			});

			// wait for the appview to update
			await whenAppViewReady(appview, res.uri, (v) => {
				return typeof v?.uri === 'string';
			});
			return res;
		},
		onSuccess() {
			invalidateMyLists(queryClient);
			void queryClient.invalidateQueries({
				queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
			});
		},
	});
}
