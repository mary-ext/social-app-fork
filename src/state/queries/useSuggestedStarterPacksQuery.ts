import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { aggregateUserInterests, createBskyTopicsHeader } from '#/lib/api/feed/utils';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
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
		enabled: !!preferences && enabled !== false,
		staleTime: STALE.MINUTES.THREE,
		queryKey: createSuggestedStarterPacksQueryKey(overrideInterests),
		queryFn: () =>
			ok(
				appview.get('app.bsky.unspecced.getSuggestedStarterPacks', {
					params: {},
					headers: {
						...createBskyTopicsHeader(
							overrideInterests ? overrideInterests.join(',') : aggregateUserInterests(preferences),
						),
						'Accept-Language': contentLangs,
					},
				}),
			),
	});
}
