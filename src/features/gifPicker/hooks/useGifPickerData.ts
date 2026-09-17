import { useFeaturedGifsQuery, useGifSearchQuery } from '#/features/gifPicker/queries';

/**
 * loads a KLIPY feed: search results for `query`, or the featured feed when it's empty.
 *
 * @param query search terms
 * @returns the active infinite query
 */
export function useGifPickerData(query: string) {
	const isSearching = query.length > 0;

	const featured = useFeaturedGifsQuery({ enabled: !isSearching });
	const search = useGifSearchQuery(query, { enabled: isSearching });

	return isSearching ? search : featured;
}
