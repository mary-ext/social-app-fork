import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { joinInterestTags, createBskyTopicsHeader } from '#/state/queries/feed-api/utils';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

export const createSuggestedStarterPacksQueryKey = (interests?: string[]) => [
	'suggested-starter-packs',
	interests?.join(','),
];

export function useSuggestedStarterPacksQuery({
	enabled,
	overrideInterests,
}: {
	enabled?: boolean;
	overrideInterests?: string[];
}) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();
	const contentLangs = getContentLanguages().join(',');

	return useQuery({
		queryKey: createSuggestedStarterPacksQueryKey(overrideInterests),
		enabled: !!preferences && enabled !== false,
		staleTime: STALE.MINUTES.THREE,
		queryFn: ({ signal }) =>
			ok(
				appview.get('app.bsky.unspecced.getSuggestedStarterPacks', {
					signal,
					headers: {
						...createBskyTopicsHeader(
							overrideInterests ? overrideInterests.join(',') : joinInterestTags(preferences),
						),
						'Accept-Language': contentLangs,
					},
					params: {},
				}),
			),
	});
}
