import {
	type AppBskyActorDefs,
	type AppBskyNotificationDeclaration,
	type AppBskyNotificationListActivitySubscriptions,
} from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type Did } from '@atcute/lexicons';
import { t } from '@lingui/core/macro';
import {
	type InfiniteData,
	type QueryClient,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { getRecord, putRecord } from '#/lib/api/records';

import { useClients, useSession } from '#/state/session';

import * as Toast from '#/components/Toast';

export const RQKEY_getActivitySubscriptions = ['activity-subscriptions'];
export const RQKEY_getNotificationDeclaration = ['notification-declaration'];

export function useActivitySubscriptionsQuery() {
	const { appview } = useClients();

	return useInfiniteQuery({
		queryKey: RQKEY_getActivitySubscriptions,
		queryFn: ({ pageParam }) =>
			ok(
				appview.get('app.bsky.notification.listActivitySubscriptions', {
					params: { cursor: pageParam },
				}),
			),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (prev) => prev.cursor,
	});
}

export function useNotificationDeclarationQuery() {
	const { pds } = useClients();
	const { currentAccount } = useSession();
	return useQuery({
		queryKey: RQKEY_getNotificationDeclaration,
		queryFn: async () => {
			try {
				return await getRecord(pds!, {
					collection: 'app.bsky.notification.declaration',
					repo: currentAccount!.did as Did,
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
				repo: currentAccount!.did as Did,
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
			Toast.show(t`Failed to update notification declaration`);
			queryClient.invalidateQueries({
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
