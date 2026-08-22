import type { ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMutation } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';

import { getClients, useSession } from '#/state/session';

export function useLikeMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation({
		mutationFn: async ({ uri, cid }: { uri: string; cid: string }) => {
			const res = await createRecord(pds!, {
				repo: currentAccount!.did,
				record: {
					$type: 'app.bsky.feed.like',
					createdAt: new Date().toISOString(),
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `FeedSourceInfo.uri` widens to `string`; a likeable feed always has an at-uri
					subject: { cid: cid, uri: uri as ResourceUri },
				},
			});
			return { uri: res.uri };
		},
	});
}

export function useUnlikeMutation() {
	const { pds } = getClients();
	const { currentAccount } = useSession();
	return useMutation({
		mutationFn: async ({ uri }: { uri: string }) => {
			await deleteRecord(pds!, {
				repo: currentAccount!.did,
				collection: 'app.bsky.feed.like',
				rkey: parseCanonicalResourceUri(uri).rkey,
			});
		},
	});
}
