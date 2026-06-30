import type { ParsedCanonicalResourceUri } from '@atcute/lexicons/syntax';

import type { TrendingTopic } from '#/state/queries/trending/useTrendingTopics';

import { m } from '#/paraglide/messages';

type ParsedTrendingTopic =
	| {
			type: 'topic' | 'tag' | 'starter-pack' | 'unknown';
			label: string;
			displayName: string;
			url: string;
			uri: undefined;
	  }
	| {
			type: 'profile' | 'feed';
			label: string;
			displayName: string;
			url: string;
			uri: ParsedCanonicalResourceUri;
	  };

export function useTopic(raw: TrendingTopic): ParsedTrendingTopic {
	const { topic: displayName, link } = raw;

	if (link.startsWith('/search')) {
		return {
			type: 'topic',
			label: m['components.trendingTopics.a11y.browseAbout']({ name: displayName }),
			displayName,
			uri: undefined,
			url: link,
		};
	} else if (link.startsWith('/hashtag')) {
		return {
			type: 'tag',
			label: m['components.trendingTopics.a11y.browseTag']({ name: displayName }),
			displayName,
			uri: undefined,
			url: link,
		};
	} else if (link.startsWith('/starter-pack')) {
		return {
			type: 'starter-pack',
			label: m['components.trendingTopics.a11y.browseStarterPack']({ name: displayName }),
			displayName,
			uri: undefined,
			url: link,
		};
	}

	return {
		type: 'unknown',
		label: m['components.trendingTopics.a11y.browseTopic']({ name: displayName }),
		displayName,
		uri: undefined,
		url: link,
	};
}
