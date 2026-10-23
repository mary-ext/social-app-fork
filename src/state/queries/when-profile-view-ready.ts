import type { AppBskyActorDefs } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons';

import { until } from '#/lib/utils/until';

/**
 * polls the AppView's profile view until it satisfies a condition, giving up after about five seconds.
 *
 * @param appview the AppView client
 * @param actor the profile to poll
 * @param ready whether a fetched profile view reflects the awaited change
 */
export const whenProfileViewReady = async (
	appview: Client,
	actor: ActorIdentifier,
	ready: (view: AppBskyActorDefs.ProfileViewDetailed) => boolean,
): Promise<void> => {
	await until(
		5, // 5 tries
		1e3, // 1s delay between tries
		(res) => res !== undefined && ready(res),
		() => ok(appview.get('app.bsky.actor.getProfile', { params: { actor } })),
	);
};
