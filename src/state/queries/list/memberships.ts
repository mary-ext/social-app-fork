import type { AppBskyGraphGetListsWithMembership } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { queryOptions, useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';
import { accumulate } from '#/lib/utils/accumulate';

import { RQKEY_WITH_MEMBERSHIP } from '#/state/queries/list/keys';
import { getClients } from '#/state/session';

export type ListWithMembership = AppBskyGraphGetListsWithMembership.ListWithMembership;

/** fetches the signed-in user's curate and moderation lists, each annotated with the given actor's membership. */
export function listsWithMembershipQueryOptions({
	actor,
	appview,
	enabled = true,
}: {
	actor?: Did;
	appview: Client;
	enabled?: boolean;
}) {
	return queryOptions<ListWithMembership[]>({
		staleTime: STALE.MINUTES.ONE,
		queryKey: RQKEY_WITH_MEMBERSHIP(actor),
		queryFn: ({ signal }) =>
			accumulate((cursor) =>
				ok(
					appview.get('app.bsky.graph.getListsWithMembership', {
						signal,
						params: { actor: actor!, cursor, limit: 50 },
					}),
				).then((data) => ({ cursor: data.cursor, items: data.listsWithMembership })),
			),
		enabled: !!actor && enabled,
	});
}

export function useListsWithMembershipQuery(params: { actor?: Did; enabled?: boolean }) {
	const { appview } = getClients();
	return useQuery(listsWithMembershipQueryOptions({ ...params, appview }));
}
