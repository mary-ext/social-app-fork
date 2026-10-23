import type { AppBskyGraphGetLists } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateList,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { type InfiniteData, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { PROFILE_LISTS_RQKEY } from '#/state/queries/profile/keys';
import { getClients } from '#/state/session';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

export function useProfileListsQuery(did: Did) {
	const moderationOpts = useModerationOpts();
	const enabled = !!moderationOpts;
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyGraphGetLists.$output,
		Error,
		InfiniteData<AppBskyGraphGetLists.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: PROFILE_LISTS_RQKEY(did),
		enabled,
		staleTime: STALE.MINUTES.ONE,
		queryFn: ({ pageParam, signal }: { pageParam: RQPageParam; signal: AbortSignal }) =>
			ok(
				appview.get('app.bsky.graph.getLists', {
					signal,
					params: { actor: did, cursor: pageParam, limit: PAGE_SIZE },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		select(data) {
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						lists: page.lists.filter((list) => {
							const decision = moderateList(list, moderationOpts!);
							return !getDisplayRestrictions(decision, DisplayContext.ContentList).filters.some(
								(cause) => cause.type !== ModerationCauseType.MutedPermanent,
							);
						}),
					};
				}),
			};
		},
	});
}
