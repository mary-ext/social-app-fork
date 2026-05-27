import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { type ChatBskyConvoDefs, type ChatBskyConvoListConvos } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import { type InfiniteData, type QueryClient, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import throttle from 'lodash.throttle';

import { moderateProfile, type ModerationOpts } from '#/lib/moderation/compat';

import { useCurrentConvoId } from '#/state/messages/current-convo-id';
import { useMessagesEventBus } from '#/state/messages/events';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useClients, useSession } from '#/state/session';

import { parseConvoView } from '#/components/dms/util';

import { useLeftConvos } from './leave-conversation';

const DEFAULT_LIMIT = 10;
export const UNREAD_LIMIT = 20;

export const RQKEY_ROOT = 'convo-list';
export const RQKEY = (
	status: 'accepted' | 'request' | 'all',
	readState: 'all' | 'unread' = 'all',
	kind: 'all' | 'group' | 'direct' = 'all',
	lockStatus: 'unlocked' | 'locked' | 'locked-permanently' | undefined = undefined,
	limit?: number,
) => [RQKEY_ROOT, status, readState, kind, lockStatus, limit];
type RQPageParam = string | undefined;

export function useListConvosQuery({
	enabled,
	status,
	readState = 'all',
	kind = 'all',
	limit = DEFAULT_LIMIT,
	lockStatus,
}: {
	enabled?: boolean;
	status?: 'request' | 'accepted';
	readState?: 'all' | 'unread';
	kind?: 'all' | 'group' | 'direct';
	limit?: number;
	lockStatus?: 'unlocked' | 'locked' | 'locked-permanently';
} = {}) {
	const { chat } = useClients();

	return useInfiniteQuery({
		enabled,
		queryKey: RQKEY(status ?? 'all', readState, kind, lockStatus, limit),
		queryFn: async ({ pageParam }) => {
			if (!chat) throw new Error('Not signed in');
			const data = await ok(
				chat.get('chat.bsky.convo.listConvos', {
					params: {
						limit,
						cursor: pageParam,
						readState: readState === 'unread' ? 'unread' : undefined,
						kind: kind === 'all' ? undefined : kind,
						lockStatus,
						status,
					},
				}),
			);
			return data;
		},
		initialPageParam: undefined as RQPageParam,
		getNextPageParam: (lastPage) => lastPage.cursor,
	});
}

const ListConvosContext = createContext<{
	accepted: ChatBskyConvoDefs.ConvoView[];
	request: ChatBskyConvoDefs.ConvoView[];
} | null>(null);
ListConvosContext.displayName = 'ListConvosContext';

export function useListConvos() {
	const ctx = useContext(ListConvosContext);
	if (!ctx) {
		throw new Error('useListConvos must be used within a ListConvosProvider');
	}
	return ctx;
}

const empty = { accepted: [], request: [] };
export function ListConvosProvider({ children }: { children: React.ReactNode }) {
	const { hasSession } = useSession();

	if (!hasSession) {
		return <ListConvosContext.Provider value={empty}>{children}</ListConvosContext.Provider>;
	}

	return <ListConvosProviderInner>{children}</ListConvosProviderInner>;
}

export function ListConvosProviderInner({ children }: { children: React.ReactNode }) {
	const { refetch, data } = useListConvosQuery({
		readState: 'unread',
		limit: UNREAD_LIMIT,
		lockStatus: 'unlocked',
	});
	const messagesBus = useMessagesEventBus();
	const queryClient = useQueryClient();
	const { currentConvoId } = useCurrentConvoId();
	const { currentAccount } = useSession();
	const leftConvos = useLeftConvos();

	const debouncedRefetch = useMemo(() => {
		const refetchAndInvalidate = () => {
			void refetch();
			void queryClient.invalidateQueries({ queryKey: [RQKEY_ROOT] });
		};
		return throttle(refetchAndInvalidate, 500, {
			leading: true,
			trailing: true,
		});
	}, [refetch, queryClient]);

	useEffect(() => {
		const unsub = messagesBus.on(
			(events) => {
				if (events.type !== 'logs') return;

				for (const log of events.logs) {
					switch (log.$type) {
						case 'chat.bsky.convo.defs#logBeginConvo': {
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logLeaveConvo': {
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticDelete(log.convoId, old),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logDeleteMessage': {
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(log.convoId, old, (convo) => {
									const logMessage = log.message;
									const lastMessage = convo.lastMessage;
									const isLoggedMessageOrDeleted =
										logMessage.$type === 'chat.bsky.convo.defs#deletedMessageView' ||
										logMessage.$type === 'chat.bsky.convo.defs#messageView';
									const isLastMessageOrDeleted =
										lastMessage?.$type === 'chat.bsky.convo.defs#deletedMessageView' ||
										lastMessage?.$type === 'chat.bsky.convo.defs#messageView';
									if (isLoggedMessageOrDeleted && isLastMessageOrDeleted) {
										return logMessage.id === lastMessage.id
											? {
													...convo,
													rev: log.rev,
													lastMessage: logMessage,
												}
											: convo;
									} else {
										return convo;
									}
								}),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logCreateMessage': {
							// Store in a new var to avoid TS errors due to closures.
							const logRef: ChatBskyConvoDefs.LogCreateMessage = log;

							// Get all matching queries
							const queries = queryClient.getQueriesData<ConvoListQueryData>({
								queryKey: [RQKEY_ROOT],
							});

							// Check if convo exists in any query
							let foundConvo: ChatBskyConvoDefs.ConvoView | null = null;
							for (const [_key, query] of queries) {
								if (!query) continue;
								const convo = getConvoFromQueryData(logRef.convoId, query);
								if (convo) {
									foundConvo = convo;
									break;
								}
							}

							if (!foundConvo) {
								// Convo not found, trigger refetch
								debouncedRefetch();
								return;
							}

							const messageIsMessageOrDeleted =
								logRef.message.$type === 'chat.bsky.convo.defs#messageView' ||
								logRef.message.$type === 'chat.bsky.convo.defs#deletedMessageView';

							// Update the convo
							const updatedConvo = {
								...foundConvo,
								rev: logRef.rev,
								lastMessage: logRef.message,
								unreadCount:
									foundConvo.id !== currentConvoId
										? messageIsMessageOrDeleted &&
											'sender' in logRef.message &&
											logRef.message.sender.did !== currentAccount?.did
											? foundConvo.unreadCount + 1
											: foundConvo.unreadCount
										: 0,
							};

							function filterConvoFromPage(convo: ChatBskyConvoDefs.ConvoView[]) {
								return convo.filter((c) => c.id !== logRef.convoId);
							}

							// Update all matching queries
							function updateFn(old?: ConvoListQueryData) {
								if (!old) return old;
								return {
									...old,
									pages: old.pages.map((page, i) => {
										if (i === 0) {
											return {
												...page,
												convos: [updatedConvo, ...filterConvoFromPage(page.convos)],
											};
										}
										return {
											...page,
											convos: filterConvoFromPage(page.convos),
										};
									}),
								};
							}
							// always update the unread one
							queryClient.setQueriesData({ queryKey: RQKEY('all', 'unread') }, (old?: ConvoListQueryData) =>
								old
									? updateFn(old)
									: ({
											pageParams: [undefined],
											pages: [{ convos: [updatedConvo], cursor: undefined }],
										} satisfies ConvoListQueryData),
							);
							// update the other ones based on status of the incoming message
							if (updatedConvo.status === 'accepted') {
								queryClient.setQueriesData({ queryKey: RQKEY('accepted') }, updateFn);
							} else if (updatedConvo.status === 'request') {
								queryClient.setQueriesData({ queryKey: RQKEY('request') }, updateFn);
							}
							break;
						}
						case 'chat.bsky.convo.defs#logReadMessage': {
							const logRef: ChatBskyConvoDefs.LogReadMessage = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(logRef.convoId, old, (convo) => ({
									...convo,
									unreadCount: 0,
									rev: logRef.rev,
								})),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logAcceptConvo': {
							const logRef: ChatBskyConvoDefs.LogAcceptConvo = log;
							const requests = queryClient.getQueryData<ConvoListQueryData>(RQKEY('request'));
							if (!requests) {
								debouncedRefetch();
								return;
							}
							const acceptedConvo = getConvoFromQueryData(log.convoId, requests);
							if (!acceptedConvo) {
								debouncedRefetch();
								return;
							}
							queryClient.setQueryData(RQKEY('request'), (old?: ConvoListQueryData) =>
								optimisticDelete(logRef.convoId, old),
							);
							queryClient.setQueriesData({ queryKey: RQKEY('accepted') }, (old?: ConvoListQueryData) => {
								if (!old) {
									debouncedRefetch();
									return old;
								}
								return {
									...old,
									pages: old.pages.map((page, i) => {
										if (i === 0) {
											return {
												...page,
												convos: [{ ...acceptedConvo, status: 'accepted' }, ...page.convos],
											};
										}
										return page;
									}),
								};
							});
							break;
						}
						case 'chat.bsky.convo.defs#logMuteConvo': {
							const logRef: ChatBskyConvoDefs.LogMuteConvo = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(logRef.convoId, old, (convo) => ({
									...convo,
									muted: true,
									rev: logRef.rev,
								})),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logUnmuteConvo': {
							const logRef: ChatBskyConvoDefs.LogUnmuteConvo = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(logRef.convoId, old, (convo) => ({
									...convo,
									muted: false,
									rev: logRef.rev,
								})),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logAddReaction': {
							const logRef: ChatBskyConvoDefs.LogAddReaction = log;
							if (logRef.message.$type !== 'chat.bsky.convo.defs#messageView') break;
							const message = logRef.message;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(logRef.convoId, old, (convo) => ({
									...convo,
									lastReaction: {
										$type: 'chat.bsky.convo.defs#messageAndReactionView',
										reaction: logRef.reaction,
										message,
									},
									rev: logRef.rev,
								})),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logRemoveReaction': {
							const logRef: ChatBskyConvoDefs.LogRemoveReaction = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(logRef.convoId, old, (convo) => {
									if (
										// if the convo is the same
										logRef.convoId === convo.id &&
										convo.lastReaction?.$type === 'chat.bsky.convo.defs#messageAndReactionView' &&
										logRef.message.$type === 'chat.bsky.convo.defs#messageView' &&
										// ...and the message is the same
										convo.lastReaction.message.id === logRef.message.id &&
										// ...and the reaction is the same
										convo.lastReaction.reaction.sender.did === logRef.reaction.sender.did &&
										convo.lastReaction.reaction.value === logRef.reaction.value
									) {
										return {
											...convo,
											// ...remove the reaction. hopefully they didn't react twice in a row!
											lastReaction: undefined,
											rev: logRef.rev,
										};
									} else {
										return convo;
									}
								}),
							);
							break;
						}
					}
				}
			},
			{
				// get events for all chats
				convoId: undefined,
			},
		);

		return () => unsub();
	}, [messagesBus, currentConvoId, queryClient, currentAccount?.did, debouncedRefetch]);

	const ctx = useMemo(() => {
		const convos =
			data?.pages.flatMap((page) => page.convos).filter((convo) => !leftConvos.includes(convo.id)) ?? [];
		return {
			accepted: convos.filter((conv) => conv.status === 'accepted'),
			request: convos.filter((conv) => conv.status === 'request'),
		};
	}, [data, leftConvos]);

	return <ListConvosContext.Provider value={ctx}>{children}</ListConvosContext.Provider>;
}

export function useUnreadMessageCount() {
	const { currentConvoId } = useCurrentConvoId();
	const { currentAccount } = useSession();
	const { accepted, request } = useListConvos();
	const moderationOpts = useModerationOpts();

	return useMemo<{
		count: number;
		numUnread?: string;
		hasNew: boolean;
	}>(() => {
		const acceptedCount = calculateCount(accepted, currentAccount?.did, currentConvoId, moderationOpts);
		const requestCount = calculateCount(request, currentAccount?.did, currentConvoId, moderationOpts);
		if (acceptedCount > 0) {
			const total = acceptedCount + Math.min(requestCount, 1);
			return {
				count: total,
				numUnread: total > 10 ? '10+' : String(total),
				// only needed when numUnread is undefined
				hasNew: false,
			};
		} else if (requestCount > 0) {
			return {
				count: 1,
				numUnread: undefined,
				hasNew: true,
			};
		} else {
			return {
				count: 0,
				numUnread: undefined,
				hasNew: false,
			};
		}
	}, [accepted, request, currentAccount?.did, currentConvoId, moderationOpts]);
}

function calculateCount(
	convos: ChatBskyConvoDefs.ConvoView[],
	currentAccountDid: string | undefined,
	currentConvoId: string | undefined,
	moderationOpts: ModerationOpts | undefined,
) {
	return (
		convos
			.filter((convo) => convo.id !== currentConvoId)
			.reduce((acc, convoView) => {
				const convo = parseConvoView(convoView, currentAccountDid);

				if (!convo || !moderationOpts) return acc;

				const shouldIgnore =
					convo.view.muted ||
					!convo.primaryMember ||
					moderateProfile(convo.primaryMember, moderationOpts).blocked ||
					convo.primaryMember.handle === 'missing.invalid' ||
					(convo.kind === 'group' && convo.details.lockStatus !== 'unlocked');
				const unreadCount = !shouldIgnore && convo.view.unreadCount > 0 ? 1 : 0;

				return acc + unreadCount;
			}, 0) ?? 0
	);
}

export type ConvoListQueryData = {
	pageParams: Array<string | undefined>;
	pages: Array<ChatBskyConvoListConvos.$output>;
};

export function useOnMarkAsRead() {
	const queryClient = useQueryClient();

	return useCallback(
		(chatId: string) => {
			queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) => {
				if (!old) return old;
				return optimisticUpdate(chatId, old, (convo) => ({
					...convo,
					unreadCount: 0,
				}));
			});
		},
		[queryClient],
	);
}

function optimisticUpdate(
	chatId: string,
	old?: ConvoListQueryData,
	updateFn?: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
) {
	if (!old || !updateFn) return old;

	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			convos: page.convos.map((convo) => (chatId === convo.id ? updateFn(convo) : convo)),
		})),
	};
}

function optimisticDelete(chatId: string, old?: ConvoListQueryData) {
	if (!old) return old;

	return {
		...old,
		pages: old.pages.map((page) => ({
			...page,
			convos: page.convos.filter((convo) => chatId !== convo.id),
		})),
	};
}

export function getConvoFromQueryData(chatId: string, old: ConvoListQueryData) {
	for (const page of old.pages) {
		for (const convo of page.convos) {
			if (convo.id === chatId) {
				return convo;
			}
		}
	}
	return null;
}

export function* findAllProfilesInQueryData(queryClient: QueryClient, did: string) {
	const queryDatas = queryClient.getQueriesData<InfiniteData<ChatBskyConvoListConvos.$output>>({
		queryKey: [RQKEY_ROOT],
	});
	for (const [_queryKey, queryData] of queryDatas) {
		if (!queryData?.pages) {
			continue;
		}

		for (const page of queryData.pages) {
			for (const convo of page.convos) {
				for (const member of convo.members) {
					if (member.did === did) {
						yield member;
					}
				}
			}
		}
	}
}
