import type { Cid, Did, ResourceUri } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { useMutation } from '@tanstack/react-query';

import { createRecord, deleteRecord } from '#/lib/api/records';

import { useClients, useSession } from '#/state/session';

export function useLikeMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation({
		mutationFn: async ({ uri, cid }: { uri: string; cid: string }) => {
			const res = await createRecord(pds!, {
				collection: 'app.bsky.feed.like',
				record: {
					$type: 'app.bsky.feed.like',
					createdAt: new Date().toISOString(),
					subject: { cid: cid as Cid, uri: uri as ResourceUri },
				},
				repo: currentAccount!.did as Did,
			});
			return { uri: res.uri };
		},
	});
}

export function useUnlikeMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useMutation({
		mutationFn: async ({ uri }: { uri: string }) => {
			await deleteRecord(pds!, {
				collection: 'app.bsky.feed.like',
				repo: currentAccount!.did as Did,
				rkey: parseCanonicalResourceUri(uri).rkey,
			});
		},
	});
}
