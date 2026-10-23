import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * drops all but the first page of matching infinite queries, then invalidates them so only that page is
 * refetched.
 *
 * @param queryClient query client
 * @param queryKey key prefix of the infinite queries
 * @returns promise resolving once the invalidation completes
 */
export const truncateAndInvalidate = async (queryClient: QueryClient, queryKey: QueryKey) => {
	queryClient.setQueriesData<InfiniteData<unknown>>({ queryKey }, (data) => {
		if (data) {
			return {
				pageParams: data.pageParams.slice(0, 1),
				pages: data.pages.slice(0, 1),
			};
		}
		return data;
	});
	return queryClient.invalidateQueries({ queryKey });
};
