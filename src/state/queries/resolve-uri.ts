import { type Client, ok } from '@atcute/client';
import type { Handle } from '@atcute/lexicons';
import { isResourceUri, parseResourceUri } from '@atcute/lexicons/syntax';

import { type QueryClient, queryOptions, useQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

import { useUnstableProfileViewCache } from './profile';

const RQKEY_ROOT = 'resolved-did';
export const RQKEY = (didOrHandle: string) => [RQKEY_ROOT, didOrHandle];

const resolvedDidQueryOptions = (
	appview: Client,
	getUnstableProfile: (did: string) => { did: string } | undefined,
	didOrHandle: string | undefined,
) =>
	queryOptions({
		staleTime: STALE.HOURS.ONE,
		queryKey: RQKEY(didOrHandle ?? ''),
		queryFn: async () => {
			if (!didOrHandle) return '';
			// Just return the did if it's already one
			if (didOrHandle.startsWith('did:')) return didOrHandle;

			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', {
					params: { handle: didOrHandle as Handle },
				}),
			);
			return res.did;
		},
		initialData: () => {
			// Return undefined if no did or handle
			if (!didOrHandle) return;
			const profile = getUnstableProfile(didOrHandle);
			return profile?.did;
		},
		enabled: !!didOrHandle,
	});

export function useResolveUriQuery(uri: string | undefined) {
	const urip = uri && isResourceUri(uri) ? parseResourceUri(uri) : undefined;
	const host = urip?.repo;

	const { appview } = useClients();
	const { getUnstableProfile } = useUnstableProfileViewCache();

	return useQuery({
		...resolvedDidQueryOptions(appview, getUnstableProfile, host),
		select: (did) => ({
			did,
			uri: urip ? `at://${did}/${urip.collection}/${urip.rkey}` : '',
		}),
	});
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
	const { appview } = useClients();
	const { getUnstableProfile } = useUnstableProfileViewCache();

	return useQuery(resolvedDidQueryOptions(appview, getUnstableProfile, didOrHandle));
}

export function precacheResolvedUri(queryClient: QueryClient, handle: string, did: string) {
	// seed both keys so navigation by either identifier resolves from cache;
	// links default to DID, but handle-based entry points still benefit
	queryClient.setQueryData<string>(RQKEY(handle), did);
	queryClient.setQueryData<string>(RQKEY(did), did);
}
