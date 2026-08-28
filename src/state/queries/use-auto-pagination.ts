import { useEffect, useRef } from 'react';

interface AutoPaginationQuery {
	data?: { pageParams: readonly unknown[] };
	isLoading: boolean;
	isRefetching: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	fetchNextPage: () => Promise<unknown>;
}

const MAX_AUTO_PAGINATION_ATTEMPTS = 50;

/**
 * fetches pages until the filtered item count reaches `pageSize`.
 *
 * @param options.query infinite query to paginate
 * @param options.itemCount filtered item count
 * @param options.pageSize target item count
 */
export function useAutoPagination({
	query,
	itemCount,
	pageSize,
}: {
	query: AutoPaginationQuery;
	itemCount: number;
	pageSize: number;
}) {
	const lastItemCount = useRef(0);
	const lastPageParams = useRef(query.data?.pageParams);
	const wantedItemCount = useRef(pageSize);
	const attemptCount = useRef(0);

	useEffect(() => {
		const pageParams = query.data?.pageParams;
		const previousPageParams = lastPageParams.current;

		// appended pages retain the existing parameter prefix.
		const continuedPagination =
			pageParams !== undefined &&
			previousPageParams !== undefined &&
			pageParams.length > previousPageParams.length &&
			previousPageParams.every((param, index) => Object.is(param, pageParams[index]));

		if (pageParams !== previousPageParams && previousPageParams !== undefined && !continuedPagination) {
			wantedItemCount.current = pageSize;
			attemptCount.current = 0;
		}
		lastPageParams.current = pageParams;

		if (itemCount !== lastItemCount.current) {
			attemptCount.current = 0;
			if (itemCount < lastItemCount.current) {
				wantedItemCount.current = Math.max(itemCount, pageSize);
			}
			lastItemCount.current = itemCount;
		}

		if (query.isLoading || query.isRefetching) {
			wantedItemCount.current = pageSize;
			attemptCount.current = 0;
			return;
		}

		if (query.isFetchingNextPage) {
			if (itemCount > wantedItemCount.current) {
				wantedItemCount.current = itemCount + pageSize;
			}
			return;
		}

		if (!query.hasNextPage) {
			return;
		}

		if (itemCount >= wantedItemCount.current) {
			attemptCount.current = 0;
			return;
		}

		if (attemptCount.current >= MAX_AUTO_PAGINATION_ATTEMPTS) {
			return;
		}

		attemptCount.current++;
		void query.fetchNextPage();
	}, [itemCount, pageSize, query]);
}
