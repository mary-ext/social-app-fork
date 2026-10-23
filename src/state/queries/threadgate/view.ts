import type { AppBskyFeedDefs } from '@atcute/bluesky';
import type { ResourceUri } from '@atcute/lexicons';

import { queryOptions, useQuery } from '@tanstack/react-query';

import { STALE } from '#/lib/query/const';

import { useGetPost } from '#/state/queries/post/post';
import { createThreadgateViewQueryKey } from '#/state/queries/threadgate/keys';

/**
 * builds the query options for a post's threadgate view.
 *
 * @param options.getPost post fetcher from {@link useGetPost}
 * @param options.postUri the post's AT-URI; the query function must not run while it's undefined
 * @returns query options resolving to the threadgate view, or null if the post has none
 */
export const threadgateViewQueryOptions = ({
	getPost,
	postUri,
}: {
	getPost: ReturnType<typeof useGetPost>;
	postUri: ResourceUri | undefined;
}) => {
	return queryOptions({
		queryKey: createThreadgateViewQueryKey(postUri || ''),
		staleTime: STALE.MINUTES.ONE,
		async queryFn() {
			const post = await getPost({ uri: postUri! });
			return post.threadgate ?? null;
		},
	});
};

export function useThreadgateViewQuery({
	postUri,
	initialData,
}: {
	postUri?: ResourceUri;
	initialData?: AppBskyFeedDefs.ThreadgateView;
} = {}) {
	const getPost = useGetPost();

	return useQuery({
		...threadgateViewQueryOptions({ getPost, postUri }),
		enabled: !!postUri,
		placeholderData: initialData,
	});
}
