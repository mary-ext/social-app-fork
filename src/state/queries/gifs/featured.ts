import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

import { RQKEY_FEATURED } from '#/state/queries/gifs/keys';
import { getTrendingGifs } from '#/state/queries/gifs/lib/klipy';

const featuredGifsOptions = infiniteQueryOptions({
	queryKey: RQKEY_FEATURED,
	// discard trending results when the picker closes so reopening loads fresh results.
	gcTime: 0,
	// preserve loaded pages when navigation remounts a view.
	staleTime: Infinity,
	queryFn: ({ pageParam, signal }) => getTrendingGifs({ pos: pageParam }, signal),
	initialPageParam: undefined as string | undefined,
	getNextPageParam: (lastPage) => lastPage.next,
});

export function useFeaturedGifsQuery(options?: { enabled?: boolean }) {
	return useInfiniteQuery({
		...featuredGifsOptions,
		enabled: options?.enabled,
	});
}

/**
 * loads and retains the featured feed without subscribing to updates. call for the picker's lifetime to
 * preserve results between views.
 */
export function useRetainFeaturedGifs() {
	useInfiniteQuery({
		...featuredGifsOptions,
		notifyOnChangeProps: [],
	});
}
