import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { serializeUserInterests, createBskyTopicsHeader } from '#/lib/bsky-topics';
import { STALE } from '#/lib/query/const';

import { getContentLanguages } from '#/state/preferences/languages';
import { usePreferencesQuery } from '#/state/queries/preferences/preferences';
import { createSuggestedStarterPacksQueryKey } from '#/state/queries/starter-pack/keys';
import { getClients } from '#/state/session';

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
							overrideInterests ? overrideInterests.join(',') : serializeUserInterests(preferences),
						),
						'Accept-Language': contentLangs,
					},
					params: {},
				}),
			),
	});
}
