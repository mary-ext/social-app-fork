import { useCallback, useMemo } from 'react';

import type { AppBskyUnspeccedGetTrends } from '@atcute/bluesky';
import { interpretMutedWordPreference } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { useQuery } from '@tanstack/react-query';

import { aggregateUserInterests, createBskyTopicsHeader } from '#/lib/api/feed/utils';
import { hasMutedWord } from '#/lib/moderation/muted-words';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

export const DEFAULT_LIMIT = 5;

export const createGetTrendsQueryKey = () => ['trends'];

export function useGetTrendsQuery() {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();
	const keywordFilters = useMemo(() => {
		return (preferences?.moderationPrefs?.mutedWords || []).map((word) => interpretMutedWordPreference(word));
	}, [preferences?.moderationPrefs]);

	return useQuery({
		enabled: !!preferences,
		staleTime: STALE.MINUTES.THREE,
		queryKey: createGetTrendsQueryKey(),
		queryFn: () => {
			const contentLangs = getContentLanguages().join(',');
			return ok(
				appview.get('app.bsky.unspecced.getTrends', {
					params: { limit: DEFAULT_LIMIT },
					headers: {
						...createBskyTopicsHeader(aggregateUserInterests(preferences)),
						'Accept-Language': contentLangs,
					},
				}),
			);
		},
		select: useCallback(
			(data: AppBskyUnspeccedGetTrends.$output) => {
				return {
					trends: (data.trends ?? []).filter((t) => {
						return !hasMutedWord({
							keywordFilters,
							text: t.topic + ' ' + t.displayName + ' ' + t.category,
						});
					}),
				};
			},
			[keywordFilters],
		),
	});
}
