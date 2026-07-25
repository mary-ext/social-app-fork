import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';

import type { AppLink } from '#/lib/links/app-url';
import { parseBlueskyPath } from '#/lib/links/schemes/bluesky';
import { appLinkToTarget } from '#/lib/routes/app-links';

import { m } from '#/paraglide/messages';
import type { RouteTarget } from '#/routes';

type ParsedTrendingTopic = {
	label: string;
	/** where the trend links to, or undefined when its link names nothing this app routes. */
	target: RouteTarget | undefined;
};

const labelFor = (link: AppLink | undefined, name: string): string => {
	switch (link?.kind) {
		case 'hashtag':
			return m['components.trendingTopics.a11y.browseTag']({ name });
		case 'search':
			return m['components.trendingTopics.a11y.browseAbout']({ name });
		case 'starter-pack':
			return m['components.trendingTopics.a11y.browseStarterPack']({ name });
		default:
			return m['components.trendingTopics.a11y.browseTopic']({ name });
	}
};

/**
 * classifies a trend by the in-app path the API hands back, resolving it to a route target.
 *
 * @param raw the trend to classify
 * @returns the trend's accessible label and its destination
 */
export function useTopic(raw: AppBskyUnspeccedDefs.TrendView): ParsedTrendingTopic {
	const { displayName, link } = raw;

	// the appview writes trend links in bsky.app's scheme, as a path against an implied host; parsing one needs
	// a base, and only its path and query are read back out.
	const url = URL.parse(link, 'https://bsky.app');
	const parsed = url !== null ? parseBlueskyPath(url) : undefined;

	return {
		label: labelFor(parsed, displayName),
		target: parsed && appLinkToTarget(parsed),
	};
}
