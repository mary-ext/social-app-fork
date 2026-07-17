import type {
	AppBskyActorDefs,
	AppBskyNotificationDeclaration,
	AppBskyNotificationListActivitySubscriptions,
} from '@atcute/bluesky';

import {
	type InfiniteData,
	type QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { getRecord, putRecord } from '#/lib/api/records';

import { registerShadowFinders } from '#/state/cache/registry';
import { useClients, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export const RQKEY_getActivitySubscriptions = ['activity-subscriptions'];
export const RQKEY_getNotificationDeclaration = ['notification-declaration'];

export function useNotificationDeclarationQuery() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useQuery({
		queryKey: RQKEY_getNotificationDeclaration,
		queryFn: async () => {
			try {
				return await getRecord(pds!, {
					collection: 'app.bsky.notification.declaration',
					repo: currentAccount!.did,
					rkey: 'self',
				});
			} catch (err) {
				if (err instanceof Error && err.message.includes('Could not locate record')) {
					return {
						value: {
							$type: 'app.bsky.notification.declaration',
							allowSubscriptions: 'followers',
						} satisfies AppBskyNotificationDeclaration.Main,
					};
				} else {
					throw err;
				}
			}
		},
	});
}

export function useNotificationDeclarationMutation() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (record: AppBskyNotificationDeclaration.Main) => {
			return await putRecord(pds!, {
				collection: 'app.bsky.notification.declaration',
				record,
				repo: currentAccount!.did,
				rkey: 'self',
			});
		},
		onMutate: (value) => {
			queryClient.setQueryData(
				RQKEY_getNotificationDeclaration,
				(old?: { uri: string; cid: string; value: AppBskyNotificationDeclaration.Main }) => {
					if (!old) return old;
					return {
						value,
					};
				},
			);
		},
		onError: () => {
			Toast.show(m['state.notifications.error.declarationUpdate']());
			void queryClient.invalidateQueries({
				queryKey: RQKEY_getNotificationDeclaration,
			});
		},
	});
}

export function* findAllProfilesInQueryData(
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
