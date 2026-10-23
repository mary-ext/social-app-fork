import type { AppBskyActorDefs, AppBskyNotificationListActivitySubscriptions } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { type InfiniteData, type QueryClient, type QueryKey, useInfiniteQuery } from '@tanstack/react-query';

import { registerShadowFinders } from '#/state/cache/registry';
import { RQKEY_getActivitySubscriptions } from '#/state/queries/notifications/keys';
import { getClients } from '#/state/session';

const PAGE_SIZE = 25;

/**
 * lists the accounts the viewer has an activity subscription to.
 *
 * @returns an infinite query over the subscription list
 */
export function useActivitySubscriptionsQuery() {
	const { appview } = getClients();
	return useInfiniteQuery<
		AppBskyNotificationListActivitySubscriptions.$output,
		Error,
		InfiniteData<AppBskyNotificationListActivitySubscriptions.$output>,
		QueryKey,
		string | undefined
	>({
		queryKey: RQKEY_getActivitySubscriptions,
		queryFn: ({ pageParam, signal }) =>
			ok(
				appview.get('app.bsky.notification.listActivitySubscriptions', {
					signal,
					params: { cursor: pageParam, limit: PAGE_SIZE },
				}),
			),
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

function* findAllProfilesInQueryData(
	queryClient: QueryClient,
	did: string,
): Generator<AppBskyActorDefs.ProfileView, void> {
	const queryDatas = queryClient.getQueriesData<
		InfiniteData<AppBskyNotificationListActivitySubscriptions.$output>
	>({
		queryKey: RQKEY_getActivitySubscriptions,
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}
		for (const page of queryData.pages) {
			for (const subscription of page.subscriptions) {
				if (subscription.did === did) {
					yield subscription;
				}
			}
		}
	}
}

registerShadowFinders('activity-subscriptions', {
	findProfiles: findAllProfilesInQueryData,
});
