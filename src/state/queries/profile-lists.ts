import { type AppBskyGraphGetLists } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type ActorIdentifier } from '@atcute/lexicons';
import { type InfiniteData, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { moderateUserList } from '#/lib/moderation/compat';

import { useClients } from '#/state/session';

import { useModerationOpts } from '../preferences/moderation-opts';

const PAGE_SIZE = 30;
type RQPageParam = string | undefined;

export const RQKEY_ROOT = 'profile-lists';
export const RQKEY = (did: string) => [RQKEY_ROOT, did];

export function useProfileListsQuery(did: string, opts?: { enabled?: boolean }) {
	const moderationOpts = useModerationOpts();
	const enabled = opts?.enabled !== false && Boolean(moderationOpts);
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyGraphGetLists.$output,
		Error,
		InfiniteData<AppBskyGraphGetLists.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(did),
		queryFn: ({ pageParam }: { pageParam: RQPageParam }) =>
			ok(
				appview.get('app.bsky.graph.getLists', {
					params: { actor: did as ActorIdentifier, cursor: pageParam, limit: PAGE_SIZE },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled,
		select(data) {
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						lists: page.lists.filter((list) => {
							const decision = moderateUserList(list, moderationOpts!);
							return !decision.ui('contentList').filters.some((cause) => cause.type !== 'muted');
						}),
					};
				}),
			};
		},
	});
}
