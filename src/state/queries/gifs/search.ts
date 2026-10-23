import { useInfiniteQuery } from '@tanstack/react-query';

import { RQKEY_SEARCH } from '#/state/queries/gifs/keys';
import { searchGifs } from '#/state/queries/gifs/lib/klipy';

export function useGifSearchQuery(query: string, options?: { enabled?: boolean }) {
	return useInfiniteQuery({
		queryKey: RQKEY_SEARCH(query),
		enabled: !!query && options?.enabled !== false,
		// preserve loaded pages when navigation remounts a view.
		staleTime: Infinity,
		queryFn: ({ pageParam, signal }) => searchGifs({ q: query, pos: pageParam }, signal),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.next,
	});
}
