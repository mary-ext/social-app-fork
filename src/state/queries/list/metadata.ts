import type { AppBskyRichtextFacet } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getRecord, putRecord, uploadBlob } from '#/lib/api/records';
import type { ImageMeta } from '#/lib/media/edit-image';

import { FEED_INFO_RQKEY_ROOT } from '#/state/queries/feed/keys';
import { invalidateMyLists } from '#/state/queries/list/cache';
import { RQKEY } from '#/state/queries/list/keys';
import { whenAppViewReady } from '#/state/queries/list/lib/when-app-view-ready';
import { PROFILE_LISTS_RQKEY } from '#/state/queries/profile/keys';
import { getClients, useSession } from '#/state/session';

export interface ListMetadataMutateParams {
	uri: ResourceUri;
	name: string;
	description: string;
	descriptionFacets: AppBskyRichtextFacet.Main[] | undefined;
	avatar: ImageMeta | null | undefined;
}
export function useListMetadataMutation() {
	const { currentAccount } = useSession();
	const { appview, pds } = getClients();
	const queryClient = useQueryClient();
	return useMutation<{ uri: ResourceUri; cid: string }, Error, ListMetadataMutateParams>({
		async mutationFn({ uri, name, description, descriptionFacets, avatar }) {
			const { repo, rkey } = parseCanonicalResourceUri(uri);
			if (!currentAccount) {
				throw new Error('Not signed in');
			}
			if (currentAccount.did !== repo) {
				throw new Error('You do not own this list');
			}

			// get the current record
			const { value: record } = await getRecord(pds!, {
				repo: currentAccount.did,
				collection: 'app.bsky.graph.list',
				rkey,
			});

			// update the fields
			record.name = name;
			record.description = description;
			record.descriptionFacets = descriptionFacets;
			if (avatar) {
				record.avatar = await uploadBlob(pds!, avatar.blob);
			} else if (avatar === null) {
				record.avatar = undefined;
			}
			const res = await putRecord(pds!, {
				repo: currentAccount.did,
				rkey,
				record,
			});

			// wait for the appview to update
			await whenAppViewReady(appview, res.uri, (v) => {
				return v?.name === record.name && v?.description === record.description;
			});
			return res;
		},
		onSuccess(_data, variables) {
			invalidateMyLists(queryClient);
			void queryClient.invalidateQueries({
				queryKey: PROFILE_LISTS_RQKEY(currentAccount!.did),
			});
			void queryClient.invalidateQueries({
				queryKey: RQKEY(variables.uri),
			});
			void queryClient.invalidateQueries({
				queryKey: [FEED_INFO_RQKEY_ROOT],
			});
		},
	});
}
