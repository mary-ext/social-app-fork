import type { AppBskyActorDefs, AppBskyUnspeccedDefs } from '@atcute/bluesky';
import { interpretMutedWordPreference } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { definite, mapDefined, uniqueBy } from '@mary/array-fns';

import { useQuery } from '@tanstack/react-query';

import type { AppLink } from '#/lib/links/app-url';
import { parseBlueskyPath } from '#/lib/links/schemes/bluesky';
import { isBlockedOrBlocking, isMuted } from '#/lib/moderation/blocked-and-muted';
import { hasMutedWord } from '#/lib/moderation/muted-words';
import { appLinkToTarget } from '#/lib/routes/app-links';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { createBskyTopicsHeader, joinInterestTags } from '#/state/queries/feed-api/utils';
import { usePreferencesQuery } from '#/state/queries/preferences';
import { getClients } from '#/state/session';

import { m } from '#/paraglide/messages';
import type { RouteTarget } from '#/router';

export const DEFAULT_LIMIT = 5;

export type TrendingTopic = AppBskyUnspeccedDefs.TrendView & {
	label: string;
	target: RouteTarget;
};

interface QueryProps {
	enabled?: boolean;
	limit?: number;
	refetchOnWindowFocus?: boolean;
}

const labelFor = (link: AppLink, name: string): string => {
	switch (link.kind) {
		case 'hashtag': {
			return m['components.trendingTopics.a11y.browseTag']({ name });
		}
		case 'search': {
			return m['components.trendingTopics.a11y.browseAbout']({ name });
		}
		case 'starterPack': {
			return m['components.trendingTopics.a11y.browseStarterPack']({ name });
		}
		default: {
			return m['components.trendingTopics.a11y.browseTopic']({ name });
		}
	}
};

const hiddenRank = (actor: AppBskyActorDefs.ProfileViewBasic): number => {
	return isMuted(actor) || isBlockedOrBlocking(actor) ? 1 : 0;
};

const resolveTopic = (trend: AppBskyUnspeccedDefs.TrendView): TrendingTopic | undefined => {
	const url = URL.parse(trend.link, 'https://bsky.app');
	const parsed = url !== null ? parseBlueskyPath(url) : undefined;

	if (parsed === undefined) {
		return undefined;
	}

	return { ...trend, label: labelFor(parsed, trend.displayName), target: appLinkToTarget(parsed) };
};

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
	const keywordFilters = (preferences?.moderationPrefs?.mutedWords || []).map((word) =>
		interpretMutedWordPreference(word),
	);

	return useQuery({
		queryKey: createGetTrendsQueryKey({ limit }),
		enabled: enabled && !!preferences,
		staleTime: STALE.MINUTES.THREE,
		refetchOnWindowFocus,
		queryFn: async ({ signal }) => {
			const contentLangs = getContentLanguages().join(',');
			const data = await ok(
				appview.get('app.bsky.unspecced.getTrends', {
					signal,
					headers: {
						...createBskyTopicsHeader(joinInterestTags(preferences)),
						'Accept-Language': contentLangs,
					},
					params: { limit },
				}),
			);

			const trends = mapDefined(
				uniqueBy(data.trends, (trend) => trend.link),
				(trend) => {
					// oxlint-disable-next-line unicorn/no-array-sort
					trend.actors.sort((a, b) => hiddenRank(a) - hiddenRank(b));

					return resolveTopic(trend);
				},
			);

			return { trends };
		},
		select: (data) => {
			const trends = data.trends.filter((trend) => {
				const text = definite([trend.topic, trend.displayName, trend.category, trend.description]).join(' ');

				return !hasMutedWord({ keywordFilters, text });
			});

			return { trends };
		},
	});
}
