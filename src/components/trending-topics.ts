import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';
import { isActorIdentifier } from '@atcute/lexicons/syntax';

import type { RouteTarget } from '#/lib/routes/target';
import { starterPackTarget } from '#/lib/routes/targets';

import { m } from '#/paraglide/messages';

type ParsedTrendingTopic = {
	label: string;
	/** where the trend links to, or undefined when its link names nothing this app routes. */
	target: RouteTarget | undefined;
};

/**
 * classifies a trend by the in-app path the API hands back, resolving it to a route target.
 *
 * @param raw the trend to classify
 * @returns the trend's accessible label and its destination
 */
export function useTopic(raw: AppBskyUnspeccedDefs.TrendView): ParsedTrendingTopic {
	const { topic: displayName, link } = raw;

	// `link` is a path, so parsing it needs a base; only the path and query are read back out.
	const url = URL.parse(link, 'https://bsky.app');
	const segments = url?.pathname.split('/').filter(Boolean) ?? [];

	switch (segments[0]) {
		case 'search': {
			const q = url?.searchParams.get('q');
			return {
				label: m['components.trendingTopics.a11y.browseAbout']({ name: displayName }),
				// Explore and Search share `/search`; an empty query is Explore's, not a search for nothing.
				target: q ? { name: 'Search', params: { q } } : { name: 'Explore' },
			};
		}
		case 'hashtag': {
			const tag = segments[1];
			return {
				label: m['components.trendingTopics.a11y.browseTag']({ name: displayName }),
				target: tag ? { name: 'Hashtag', params: { tag } } : undefined,
			};
		}
		case 'starter-pack': {
			const [, actor, rkey] = segments;
			return {
				label: m['components.trendingTopics.a11y.browseStarterPack']({ name: displayName }),
				target: isActorIdentifier(actor) && rkey ? starterPackTarget(actor, rkey) : undefined,
			};
		}
		case 'topic': {
			const topic = segments[1];
			return {
				label: m['components.trendingTopics.a11y.browseTopic']({ name: displayName }),
				target: topic ? { name: 'Topic', params: { topic } } : undefined,
			};
		}
	}

	return {
		label: m['components.trendingTopics.a11y.browseTopic']({ name: displayName }),
		target: undefined,
	};
}
