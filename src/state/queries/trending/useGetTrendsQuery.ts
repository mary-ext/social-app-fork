import type { AppBskyUnspeccedDefs, AppBskyUnspeccedGetTrends } from '@atcute/bluesky';
import { interpretMutedWordPreference } from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';

import { definite, mapDefined } from '@mary/array-fns';

import { useQuery } from '@tanstack/react-query';

import type { AppLink } from '#/lib/links/app-url';
import { parseBlueskyPath } from '#/lib/links/schemes/bluesky';
import { hasMutedWord } from '#/lib/moderation/muted-words';
import { appLinkToTarget } from '#/lib/routes/app-links';

import { getContentLanguages } from '#/state/preferences/languages';
import { STALE } from '#/state/queries';
import { joinInterestTags, createBskyTopicsHeader } from '#/state/queries/feed-api/utils';
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

const resolveTopic = (trend: AppBskyUnspeccedDefs.TrendView): TrendingTopic | undefined => {
	const url = URL.parse(trend.link, 'https://bsky.app');
	const parsed = url !== null ? parseBlueskyPath(url) : undefined;

	if (parsed === undefined) {
		return undefined;
	}

	return { ...trend, label: labelFor(parsed, trend.displayName), target: appLinkToTarget(parsed) };
};

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
	const keywordFilters = (preferences?.moderationPrefs?.mutedWords || []).map((word) =>
		interpretMutedWordPreference(word),
	);

	return useQuery({
		queryKey: createGetTrendsQueryKey({ limit }),
		enabled: enabled && !!preferences,
		staleTime: STALE.MINUTES.THREE,
		refetchOnWindowFocus,
		queryFn: ({ signal }) => {
			const contentLangs = getContentLanguages().join(',');
			return ok(
				appview.get('app.bsky.unspecced.getTrends', {
					signal,
					headers: {
						...createBskyTopicsHeader(joinInterestTags(preferences)),
						'Accept-Language': contentLangs,
					},
					params: { limit },
				}),
			);
		},
		select: (data: AppBskyUnspeccedGetTrends.$output) => {
			const trends = mapDefined(data.trends ?? [], (trend) => {
				const text = definite([trend.topic, trend.displayName, trend.category, trend.description]).join(' ');

				if (hasMutedWord({ keywordFilters, text })) {
					return undefined;
				}

				return resolveTopic(trend);
			});

			return { trends: dedupeByLink(trends) };
		},
	});
}
