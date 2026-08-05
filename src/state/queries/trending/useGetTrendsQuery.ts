import { useCallback, useMemo } from 'react';

import type { AppBskyUnspeccedGetTrends } from '@atcute/bluesky';
import { interpretMutedWordPreference } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { definite } from '@mary/array-fns';

import { useQuery } from '@tanstack/react-query';

import { aggregateUserInterests, createBskyTopicsHeader } from '#/lib/api/feed/utils';
import { hasMutedWord } from '#/lib/moderation/muted-words';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

export const DEFAULT_LIMIT = 5;

interface QueryProps {
	enabled?: boolean;
	limit?: number;
	refetchOnWindowFocus?: boolean;
}

// the appview can repeat a topic across trends; two rows linking to the same search read as a glitch.
const dedupeByLink = <T extends { link: string }>(trends: T[]): T[] => {
	const seen = new Set<string>();
	return trends.filter((trend) => {
		if (seen.has(trend.link)) {
			return false;
		}
		seen.add(trend.link);
		return true;
	});
};

// the limit belongs in the key: callers asking for different counts get different lists back, and a shorter
// one must not satisfy a caller that wanted more.
export const createGetTrendsQueryKey = ({ limit = DEFAULT_LIMIT }: Pick<QueryProps, 'limit'> = {}) => [
	'trends',
	limit,
];

export function useGetTrendsQuery({
	enabled = true,
	limit = DEFAULT_LIMIT,
	refetchOnWindowFocus,
}: QueryProps = {}) {
	const { appview } = getClients();
	const { data: preferences } = usePreferencesQuery();
	const keywordFilters = useMemo(() => {
		return (preferences?.moderationPrefs?.mutedWords || []).map((word) => interpretMutedWordPreference(word));
	}, [preferences?.moderationPrefs]);

	return useQuery({
		queryKey: createGetTrendsQueryKey({ limit }),
		enabled: enabled && !!preferences,
		staleTime: STALE.MINUTES.THREE,
		refetchOnWindowFocus,
		queryFn: () => {
			const contentLangs = getContentLanguages().join(',');
			return ok(
				appview.get('app.bsky.unspecced.getTrends', {
					headers: {
						...createBskyTopicsHeader(aggregateUserInterests(preferences)),
						'Accept-Language': contentLangs,
					},
					params: { limit },
				}),
			);
		},
		select: useCallback(
			(data: AppBskyUnspeccedGetTrends.$output) => {
				return {
					trends: dedupeByLink(
						(data.trends ?? []).filter((t) => {
							const text = definite([t.topic, t.displayName, t.category, t.description]).join(' ');

							return !hasMutedWord({ keywordFilters, text });
						}),
					),
				};
			},
			[keywordFilters],
		),
	});
}
