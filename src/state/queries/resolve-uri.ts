import type { AnyProfileView } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, Handle, ResourceUri } from '@atcute/lexicons';
import { isDid, isResourceUri, type ParsedResourceUri, parseResourceUri } from '@atcute/lexicons/syntax';

import { type QueryClient, queryOptions, useQuery } from '@tanstack/react-query';

import { STALE } from '#/state/queries';
import { useClients } from '#/state/session';

import { useUnstableProfileViewCache } from './profile';

const RQKEY_ROOT = 'resolved-did';
export const RQKEY = (didOrHandle: string) => [RQKEY_ROOT, didOrHandle];

const resolvedDidQueryOptions = (
	appview: Client,
	getUnstableProfile: (didOrHandle: string) => AnyProfileView | undefined,
	didOrHandle: string | undefined,
) =>
	queryOptions({
		staleTime: STALE.HOURS.ONE,
		queryKey: RQKEY(didOrHandle ?? ''),
		queryFn: async (): Promise<Did> => {
			// `enabled` gates the query on `didOrHandle`, so this only fires if that gate is ever removed
			if (!didOrHandle) {
				throw new Error('resolved-did: query ran without an identifier');
			}
			// Just return the did if it's already one
			if (isDid(didOrHandle)) return didOrHandle;

			const res = await ok(
				appview.get('com.atproto.identity.resolveHandle', {
					// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the `did:` check above leaves the handle branch; the appview rejects bad handles
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

/** rebuilds a parsed at-uri against the repo's did, keeping whichever segments the original carried. */
const canonicalize = (did: Did, urip: ParsedResourceUri): ResourceUri => {
	if (urip.collection === undefined) {
		return `at://${did}`;
	}
	if (urip.rkey === undefined) {
		return `at://${did}/${urip.collection}`;
	}
	return `at://${did}/${urip.collection}/${urip.rkey}`;
};

export function useResolveUriQuery(uri: string | undefined) {
	const urip = uri && isResourceUri(uri) ? parseResourceUri(uri) : undefined;
	const host = urip?.repo;

	const { appview } = useClients();
	const { getUnstableProfile } = useUnstableProfileViewCache();

	return useQuery({
		...resolvedDidQueryOptions(appview, getUnstableProfile, host),
		select: (did) => ({
			did,
			uri: urip && canonicalize(did, urip),
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
