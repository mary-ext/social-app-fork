import type { AppBskyFeedGetActorFeeds } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateFeedGenerator,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';

import { type InfiniteData, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { useModerationOpts } from '../preferences/moderation-opts';

const PAGE_SIZE = 50;
type RQPageParam = string | undefined;

// TODO refactor invalidate on mutate?
export const RQKEY_ROOT = 'profile-feedgens';
export const RQKEY = (did: string) => [RQKEY_ROOT, did];

export function useProfileFeedgensQuery(did: string, opts?: { enabled?: boolean }) {
	const moderationOpts = useModerationOpts();
	const enabled = opts?.enabled !== false && Boolean(moderationOpts);
	const { appview } = useClients();
	return useInfiniteQuery<
		AppBskyFeedGetActorFeeds.$output,
		Error,
		InfiniteData<AppBskyFeedGetActorFeeds.$output>,
		QueryKey,
		RQPageParam
	>({
		queryKey: RQKEY(did),
		async queryFn({ pageParam }: { pageParam: RQPageParam }) {
			const data = await ok(
				appview.get('app.bsky.feed.getActorFeeds', {
					params: { actor: did as ActorIdentifier, cursor: pageParam, limit: PAGE_SIZE },
				}),
			);
			data.feeds.sort((a, b) => {
				return (b.likeCount || 0) - (a.likeCount || 0);
			});
			return data;
		},
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
		enabled,
		select(data) {
			return {
				...data,
				pages: data.pages.map((page) => {
					return {
						...page,
						feeds: page.feeds
							// filter by labels
							.filter((list) => {
								const decision = moderateFeedGenerator(list, moderationOpts!);
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
