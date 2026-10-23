import type { Client } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { queryOptions, useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { createPostgateQueryKey } from '#/state/queries/postgate/keys';
import { getPostgateRecord } from '#/state/queries/postgate/lib/record';
import { getClients } from '#/state/session';

/**
 * builds the query options for a post's postgate record.
 *
 * @param options.appview appview client, used to resolve handle-based URIs
 * @param options.pds PDS client to read the record from
 * @param options.postUri the post's AT-URI
 * @returns query options resolving to the postgate record, or null if the post has none
 */
export const postgateQueryOptions = ({
	appview,
	pds,
	postUri,
}: {
	appview: Client;
	pds: Client;
	postUri: ResourceUri;
}) => {
	return queryOptions({
		queryKey: createPostgateQueryKey(postUri),
		staleTime: STALE.SECONDS.THIRTY,
		async queryFn({ signal }) {
			return await getPostgateRecord({ appview, pds, postUri, signal }).then((res) => res ?? null);
		},
	});
};

export function usePostgateQuery({ postUri }: { postUri: ResourceUri }) {
	const { appview, pds } = getClients();
	return useQuery(postgateQueryOptions({ appview, pds: pds!, postUri }));
}
