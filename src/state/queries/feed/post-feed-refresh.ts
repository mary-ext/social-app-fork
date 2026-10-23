import {
	type InfiniteData,
	type QueryClient,
	type QueryKey,
	type QueryState,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';

import { isNetworkError } from '#/lib/errors';
import { type FeedDescriptor, toFeedRequest } from '#/lib/feeds/descriptor';

import { RQKEY } from '#/state/queries/feed/keys';
import { usePostFeedFetcher } from '#/state/queries/feed/post-feed-fetcher';
import type { FeedPageUnselected } from '#/state/queries/feed/types';

type PostFeedData = InfiniteData<FeedPageUnselected, string | undefined>;

const REFRESH_KEY_ROOT = 'post-feed-refresh';

/**
 * replaces a feed with its first page, preserving cached posts until success.
 *
 * skips requests until the initial load settles or while a top-page fetch or refresh is active.
 *
 * @param feedDesc the feed to refresh
 * @param dataUpdatedAt the feed query's `dataUpdatedAt`
 * @returns the refresh action, pending state, and last error while query data is unchanged
 */
export function usePostFeedRefresh(feedDesc: FeedDescriptor, dataUpdatedAt: number) {
	const queryClient = useQueryClient();
	const { fetchPage } = usePostFeedFetcher(feedDesc);
	const queryKey = RQKEY(feedDesc);
	const mutationKey = [REFRESH_KEY_ROOT, toFeedRequest(feedDesc)];

	const { mutate, error, isPending, variables } = useMutation({
		mutationKey,
		mutationFn: async (_dataUpdatedAt: number) => {
			const before = queryClient.getQueryData<PostFeedData>(queryKey);
			const page = await fetchPage(undefined);
			await commitRefresh(queryClient, queryKey, before, { pageParams: [undefined], pages: [page] });
		},
		onError: (e) => {
			if (!isNetworkError(e)) {
				console.error('Failed to refresh posts feed', e);
			}
		},
	});

	const refresh = () => {
		const state = queryClient.getQueryState<PostFeedData>(queryKey);
		// the initial query may still be waiting for preferences.
		if (!state || state.status === 'pending') {
			return;
		}
		if (queryClient.isMutating({ mutationKey, exact: true }) > 0 || isFetchingTop(state)) {
			return;
		}
		mutate(dataUpdatedAt);
	};

	return {
		refresh,
		error: error !== null && variables === dataUpdatedAt ? error : undefined,
		isRefreshing: isPending,
	};
}

const isTopReplaced = (queryClient: QueryClient, queryKey: QueryKey, before: PostFeedData | undefined) => {
	return queryClient.getQueryData<PostFeedData>(queryKey)?.pages[0] !== before?.pages[0];
};

const isFetchingTop = (state: QueryState<PostFeedData>) => {
	return state.fetchStatus !== 'idle' && !state.fetchMeta?.fetchMore;
};

const commitRefresh = async (
	queryClient: QueryClient,
	queryKey: QueryKey,
	before: PostFeedData | undefined,
	data: PostFeedData,
) => {
	const state = queryClient.getQueryState<PostFeedData>(queryKey);
	// a competing top-page fetch takes precedence over this refresh.
	if (isTopReplaced(queryClient, queryKey, before) || !state || isFetchingTop(state)) {
		return;
	}
	// cancel pagination so it cannot restore old pages after the refresh. await cancellation before
	// rechecking for competing writes.
	await queryClient.cancelQueries({ queryKey, exact: true });
	if (
		isTopReplaced(queryClient, queryKey, before) ||
		queryClient.getQueryState(queryKey)?.fetchStatus !== 'idle'
	) {
		return;
	}
	queryClient.setQueryData<PostFeedData>(queryKey, data);
};
