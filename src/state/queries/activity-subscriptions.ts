import { type AppBskyActorDefs, type AppBskyNotificationListActivitySubscriptions } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type AppBskyNotificationDeclaration } from '@atproto/api';
import { t } from '@lingui/core/macro';
import {
	type InfiniteData,
	type QueryClient,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { useAgent, useClients, useSession } from '#/state/session';

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
	const agent = useAgent();
	const { currentAccount } = useSession();
	return useQuery({
		queryKey: RQKEY_getNotificationDeclaration,
		queryFn: async () => {
			try {
				const response = await agent.app.bsky.notification.declaration.get({
					repo: currentAccount!.did,
					rkey: 'self',
				});
				return response;
			} catch (err) {
				if (err instanceof Error && err.message.startsWith('Could not locate record')) {
					return {
						value: {
							$type: 'app.bsky.notification.declaration',
							allowSubscriptions: 'followers',
						} satisfies AppBskyNotificationDeclaration.Record,
					};
				} else {
					throw err;
				}
			}
		},
	});
}

export function useNotificationDeclarationMutation() {
	const agent = useAgent();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (record: AppBskyNotificationDeclaration.Record) => {
			const response = await agent.app.bsky.notification.declaration.put(
				{
					repo: currentAccount!.did,
					rkey: 'self',
				},
				record,
			);
			return response;
		},
		onMutate: (value) => {
			queryClient.setQueryData(
				RQKEY_getNotificationDeclaration,
				(old?: { uri: string; cid: string; value: AppBskyNotificationDeclaration.Record }) => {
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
