import { useCallback, useMemo } from 'react';
import { type AppBskyUnspeccedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { useQuery } from '@tanstack/react-query';

import { hasMutedWord } from '#/lib/moderation/compat';

import { STALE } from '#/state/queries';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { useClients } from '#/state/session';

export type TrendingTopic = AppBskyUnspeccedDefs.TrendingTopic;

type Response = {
	topics: TrendingTopic[];
	suggested: TrendingTopic[];
};

export const DEFAULT_LIMIT = 14;

function dedup(topics: TrendingTopic[]): TrendingTopic[] {
	const seen = new Set<string>();
	return topics.filter((t) => {
		if (seen.has(t.link)) return false;
		seen.add(t.link);
		return true;
	});
}

export const trendingTopicsQueryKey = ['trending-topics'];

export function useTrendingTopics() {
	const { appview } = useClients();
	const { data: preferences } = usePreferencesQuery();
	const mutedWords = useMemo(
		() => preferences?.moderationPrefs?.mutedWords ?? [],
		[preferences?.moderationPrefs?.mutedWords],
	);

	return useQuery<Response>({
		refetchOnWindowFocus: true,
		staleTime: STALE.MINUTES.THREE,
		queryKey: trendingTopicsQueryKey,
		async queryFn() {
			const data = await ok(
				appview.get('app.bsky.unspecced.getTrendingTopics', {
					params: { limit: DEFAULT_LIMIT },
				}),
			);
			return {
				topics: data.topics ?? [],
				suggested: data.suggested ?? [],
			};
		},
		select: useCallback(
			(data: Response) => {
				return {
					topics: dedup(
						data.topics.filter((t) => {
							return !hasMutedWord({
								mutedWords,
								text: `${t.topic} ${t.displayName ?? ''} ${t.description ?? ''}`,
							});
						}),
					),
					suggested: dedup(
						data.suggested.filter((t) => {
							return !hasMutedWord({
								mutedWords,
								text: `${t.topic} ${t.displayName ?? ''} ${t.description ?? ''}`,
							});
						}),
					),
				};
			},
			[mutedWords],
		),
	});
}
