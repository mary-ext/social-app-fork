import type { AppBskyFeedDefs, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import type { Did, Handle, ResourceUri } from '@atcute/lexicons';
import { parseResourceUri } from '@atcute/lexicons/syntax';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRecord, putRecord } from '#/lib/api/records';
import { networkRetry, retry } from '#/lib/async/retry';

import { STALE } from '#/state/queries';
import { useGetPost } from '#/state/queries/post';
import type { ThreadgateAllowUISetting } from '#/state/queries/threadgate/types';
import {
	createThreadgateRecord,
	mergeThreadgateRecords,
	threadgateAllowUISettingToAllowRecordValue,
	threadgateViewToAllowUISetting,
} from '#/state/queries/threadgate/util';
import { useUpdatePostThreadThreadgateQueryCache } from '#/state/queries/usePostThread';
import { useClients, useSession } from '#/state/session';
import { useThreadgateHiddenReplyUrisAPI } from '#/state/threadgate-hidden-replies';

export * from '#/state/queries/threadgate/types';
export * from '#/state/queries/threadgate/util';

/** Must match the threadgate lexicon record definition. */
export const MAX_HIDDEN_REPLIES = 300;

export const threadgateRecordQueryKeyRoot = 'threadgate-record';

export const threadgateViewQueryKeyRoot = 'threadgate-view';
export const createThreadgateViewQueryKey = (uri: string) => [threadgateViewQueryKeyRoot, uri];
export function useThreadgateViewQuery({
	postUri,
	initialData,
}: {
	postUri?: string;
	initialData?: AppBskyFeedDefs.ThreadgateView;
} = {}) {
	const getPost = useGetPost();

	return useQuery({
		enabled: !!postUri,
		queryKey: createThreadgateViewQueryKey(postUri || ''),
		placeholderData: initialData,
		staleTime: STALE.MINUTES.ONE,
		async queryFn() {
			const post = await getPost({ uri: postUri! });
			return post.threadgate ?? null;
		},
	});
}

export async function getThreadgateRecord({
	appview,
	pds,
	postUri,
}: {
	appview: Client;
	pds: Client;
	postUri: string;
}): Promise<AppBskyFeedThreadgate.Main | null> {
	const urip = parseResourceUri(postUri);

	let repo: string = urip.repo;
	if (!repo.startsWith('did:')) {
		const resolved = await ok(
			appview.get('com.atproto.identity.resolveHandle', {
				params: { handle: repo as Handle },
			}),
		);
		repo = resolved.did;
	}

	try {
		const data = await retry(
			2,
			(e) => {
				/*
				 * If the record doesn't exist, we want to return null instead of
				 * throwing an error. NB: This will also catch reference errors, such as
				 * a typo in the URI.
				 */
				if (e instanceof Error && e.message.includes(`Could not locate record:`)) {
					return false;
				}
				return true;
			},
			() =>
				getRecord(pds, {
					collection: 'app.bsky.feed.threadgate',
					repo: repo as Did,
					rkey: urip.rkey!,
				}),
		);

		return data.value ?? null;
	} catch (e) {
		/*
		 * If the record doesn't exist, we want to return null instead of
		 * throwing an error. NB: This will also catch reference errors, such as
		 * a typo in the URI.
		 */
		if (e instanceof Error && e.message.includes(`Could not locate record:`)) {
			return null;
		} else {
			throw e;
		}
	}
}

export async function writeThreadgateRecord({
	did,
	pds,
	postUri,
	threadgate,
}: {
	did: Did;
	pds: Client;
	postUri: string;
	threadgate: AppBskyFeedThreadgate.Main;
}) {
	const postUrip = parseResourceUri(postUri);
	const record = createThreadgateRecord({
		allow: threadgate.allow, // can/should be undefined!
		hiddenReplies: threadgate.hiddenReplies || [],
		post: postUri as ResourceUri,
	});

	await networkRetry(2, () =>
		putRecord(pds, {
			collection: 'app.bsky.feed.threadgate',
			record,
			repo: did,
			rkey: postUrip.rkey!,
		}),
	);
}

export async function upsertThreadgate(
	{
		appview,
		did,
		pds,
		postUri,
	}: {
		appview: Client;
		did: Did;
		pds: Client;
		postUri: string;
	},
	callback: (
		threadgate: AppBskyFeedThreadgate.Main | null,
	) => AppBskyFeedThreadgate.Main | Promise<AppBskyFeedThreadgate.Main | undefined> | undefined,
) {
	const prev = await getThreadgateRecord({
		appview,
		pds,
		postUri,
	});
	const next = await callback(prev);
	if (!next) return;
	validateThreadgateRecordOrThrow(next);
	await writeThreadgateRecord({
		did,
		pds,
		postUri,
		threadgate: next,
	});
}

export function useSetThreadgateAllowMutation() {
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const getPost = useGetPost();
	const updatePostThreadThreadgate = useUpdatePostThreadThreadgateQueryCache();

	return useMutation({
		mutationFn: async ({ postUri, allow }: { postUri: string; allow: ThreadgateAllowUISetting[] }) => {
			return upsertThreadgate(
				{ appview, did: currentAccount!.did, pds: pds!, postUri },
				(prev): AppBskyFeedThreadgate.Main | undefined => {
					if (prev) {
						return {
							...prev,
							allow: threadgateAllowUISettingToAllowRecordValue(allow),
						};
					} else {
						return createThreadgateRecord({
							allow: threadgateAllowUISettingToAllowRecordValue(allow),
							post: postUri as ResourceUri,
						});
					}
				},
			);
		},
		async onSuccess(_, { postUri, allow }) {
			const data = await retry<AppBskyFeedDefs.ThreadgateView | undefined>(
				5, // 5 tries
				(_e) => true,
				async () => {
					const post = await getPost({ uri: postUri });
					const threadgate = post.threadgate;
					if (!threadgate) {
						throw new Error(
							`useSetThreadgateAllowMutation: could not fetch threadgate, appview may not be ready yet`,
						);
					}
					const fetchedSettings = threadgateViewToAllowUISetting(threadgate);
					const isReady = JSON.stringify(fetchedSettings) === JSON.stringify(allow);
					if (!isReady) {
						throw new Error(`useSetThreadgateAllowMutation: appview isn't ready yet`); // try again
					}
					return threadgate;
				},
				1e3, // 1s delay between tries
			).catch(() => {});

			if (data) updatePostThreadThreadgate(data);

			void queryClient.invalidateQueries({
				queryKey: [threadgateRecordQueryKeyRoot],
			});
			void queryClient.invalidateQueries({
				queryKey: [threadgateViewQueryKeyRoot],
			});
		},
	});
}

export function useToggleReplyVisibilityMutation() {
	const { appview, pds } = useClients();
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const hiddenReplies = useThreadgateHiddenReplyUrisAPI();

	return useMutation({
		mutationFn: async ({
			postUri,
			replyUri,
			action,
		}: {
			postUri: string;
			replyUri: string;
			action: 'hide' | 'show';
		}) => {
			if (action === 'hide') {
				hiddenReplies.addHiddenReplyUri(replyUri);
			} else if (action === 'show') {
				hiddenReplies.removeHiddenReplyUri(replyUri);
			}

			await upsertThreadgate(
				{ appview, did: currentAccount!.did, pds: pds!, postUri },
				(prev): AppBskyFeedThreadgate.Main | undefined => {
					if (prev) {
						if (action === 'hide') {
							return mergeThreadgateRecords(prev, {
								hiddenReplies: [replyUri as ResourceUri],
							});
						} else if (action === 'show') {
							return {
								...prev,
								hiddenReplies: prev.hiddenReplies?.filter((uri) => uri !== replyUri) || [],
							};
						}
					} else {
						if (action === 'hide') {
							return createThreadgateRecord({
								hiddenReplies: [replyUri as ResourceUri],
								post: postUri as ResourceUri,
							});
						}
					}
				},
			);
		},
		onSuccess() {
			void queryClient.invalidateQueries({
				queryKey: [threadgateRecordQueryKeyRoot],
			});
		},
		onError(_, { replyUri, action }) {
			if (action === 'hide') {
				hiddenReplies.removeHiddenReplyUri(replyUri);
			} else if (action === 'show') {
				hiddenReplies.addHiddenReplyUri(replyUri);
			}
		},
	});
}

export class MaxHiddenRepliesError extends Error {
	constructor(message?: string) {
		super(message || 'Maximum number of hidden replies reached');
		this.name = 'MaxHiddenRepliesError';
	}
}

export class InvalidInteractionSettingsError extends Error {
	constructor(message?: string) {
		super(message || 'Invalid interaction settings');
		this.name = 'InvalidInteractionSettingsError';
	}
}

export function validateThreadgateRecordOrThrow(record: AppBskyFeedThreadgate.Main) {
	if ((record.hiddenReplies?.length ?? 0) > MAX_HIDDEN_REPLIES) {
		throw new MaxHiddenRepliesError();
	}
}
