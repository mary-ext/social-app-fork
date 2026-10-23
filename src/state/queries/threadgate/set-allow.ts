import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
	isReplyAudienceEqual,
	type ReplyAudience,
	repliesFromThreadgateView,
	repliesToThreadgateAllow,
} from '#/lib/interaction-settings';
import { createThreadgateRecord } from '#/lib/threadgate';
import { retry } from '#/lib/utils/retry';

import { useGetPost } from '#/state/queries/post/post';
import { useUpdatePostThreadThreadgateQueryCache } from '#/state/queries/thread/threadgate-cache';
import { threadgateViewQueryKeyRoot } from '#/state/queries/threadgate/keys';
import { upsertThreadgate } from '#/state/queries/threadgate/lib/record';
import { getClients, useSession } from '#/state/session';

export function useSetThreadgateAllowMutation() {
	const { appview, pds } = getClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const getPost = useGetPost();
	const updatePostThreadThreadgate = useUpdatePostThreadThreadgateQueryCache();

	return useMutation({
		mutationFn: async ({ postUri, replies }: { postUri: ResourceUri; replies: ReplyAudience }) => {
			return upsertThreadgate(
				{ appview, did: currentAccount!.did, pds: pds!, postUri },
				(prev): AppBskyFeedThreadgate.Main | undefined => {
					if (prev) {
						return {
							...prev,
							allow: repliesToThreadgateAllow(replies),
						};
					} else {
						return createThreadgateRecord({
							allow: repliesToThreadgateAllow(replies),
							post: postUri,
						});
					}
				},
			);
		},
		async onSuccess(_, { postUri, replies }) {
			const data = await retry<AppBskyFeedDefs.ThreadgateView | undefined>(
				5, // 5 tries
				(_e) => true,
				async () => {
					const post = await getPost({ uri: postUri });
					const threadgate = post.threadgate;
					if (!threadgate) {
						throw new Error(
							`useSetThreadgateAllowMutation: could not fetch threadgate, appview may not be ready yet`,
						);
					}
					if (!isReplyAudienceEqual(repliesFromThreadgateView(threadgate), replies)) {
						throw new Error(`useSetThreadgateAllowMutation: appview isn't ready yet`); // try again
					}
					return threadgate;
				},
				1e3, // 1s delay between tries
			).catch(() => {});

			if (data) {
				updatePostThreadThreadgate(data);
			}

			void queryClient.invalidateQueries({
				queryKey: [threadgateViewQueryKeyRoot],
			});
		},
	});
}
