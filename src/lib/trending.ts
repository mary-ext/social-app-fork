import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';

import type { RouteTarget } from '#/router';

/** a trend resolved to an in-app destination. */
export type TrendingTopic = AppBskyUnspeccedDefs.TrendView & {
	label: string;
	target: RouteTarget;
};
