import { useEffect, useMemo } from 'react';
import type { ChatBskyActorDefs, ChatBskyConvoDefs, ChatBskyConvoListConvos } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import {
	type InfiniteData,
	type Query,
	type QueryClient,
	type QueryKey,
	useInfiniteQuery,
	useQueryClient,
} from '@tanstack/react-query';
import throttle from 'lodash.throttle';

import { useCurrentConvoId } from '#/state/messages/current-convo-id';
import { useMessagesEventBus } from '#/state/messages/events';
import { invalidateJoinLinkPreviewsForConvo } from '#/state/queries/join-links';
import { useClients, useSession } from '#/state/session';

import { RQKEY as CONVO_KEY } from './conversation';
import {
	RQKEY_PARTIAL as UNREAD_COUNTS_RQKEY_PARTIAL,
	UNREAD_ACCEPTED_CAP,
	useUnreadCountsQuery,
} from './get-unread-counts';
import {
	type ConvoRequestListQueryData,
	optimisticDeleteJoinRequest,
	RQKEY_ROOT as REQUESTS_RQKEY_ROOT,
} from './list-conversation-requests';
import { listConvoMembersQueryKey } from './list-convo-members';

const DEFAULT_LIMIT = 10;

export const RQKEY_ROOT = 'convo-list';
export const RQKEY = (
	status: 'accepted' | 'request' | 'all',
	readState: 'all' | 'unread' = 'all',
	kind: 'all' | 'group' | 'direct' = 'all',
	lockStatus: 'unlocked' | 'locked' | 'locked-permanently' | undefined = undefined,
	limit?: number,
) => [RQKEY_ROOT, status, readState, kind, lockStatus, limit] as const;

export type ConvoListItem = ChatBskyConvoListConvos.$output['convos'][number];

/**
 * Prefix key matching every convo-list query with the given status (and optionally readState), regardless of
 * the remaining params (kind, lockStatus, limit). Only valid with prefix-matching APIs (setQueriesData,
 * getQueriesData, invalidateQueries) — exact-match APIs (getQueryData, setQueryData) hash the full key and
 * will never match a prefix.
 */
export const RQKEY_PARTIAL = (status: 'accepted' | 'request' | 'all', readState?: 'all' | 'unread') =>
	readState ? [RQKEY_ROOT, status, readState] : [RQKEY_ROOT, status];

/**
 * Whether a convo satisfies the filters encoded in a convo-list query key. Caches are server-filtered, so
 * optimistic inserts must apply the same filters client-side or convos leak into lists that should exclude
 * them.
 */
export function convoMatchesQueryKey(convo: ConvoListItem, queryKey: QueryKey): boolean {
	const [, status, readState, kind, lockStatus] = queryKey as ReturnType<typeof RQKEY>;
	if (status !== 'all' && status !== convo.status) return false;
	if (readState === 'unread' && convo.unreadCount === 0) return false;
	if (convo.kind?.$type === 'chat.bsky.convo.defs#groupConvo') {
		if (kind === 'direct') return false;
		if (lockStatus && convo.kind.lockStatus !== lockStatus) return false;
	} else {
		if (kind === 'group') return false;
		// direct convos are never locked
		if (lockStatus && lockStatus !== 'unlocked') return false;
	}
	return true;
}

/**
 * Query predicate for optimistically upserting a convo into convo-list caches. Targets caches whose filters
 * the convo satisfies, plus caches the convo is already in — those get updated in place even if the convo no
 * longer matches (e.g. unreadCount dropped to 0), mirroring how read/mute log events update convos in place
 * everywhere.
 */
export function convoListQueryPredicate(convo: ConvoListItem) {
	return (query: Query): boolean => {
		const data = query.state.data as ConvoListQueryData | undefined;
		if (data && getConvoFromQueryData(convo.id, data)) return true;
		return convoMatchesQueryKey(convo, query.queryKey);
	};
}

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

export function ListConvosProvider({ children }: { children: React.ReactNode }) {
	const { hasSession } = useSession();

	if (!hasSession) {
		return <>{children}</>;
	}

	return <ListConvosProviderInner>{children}</ListConvosProviderInner>;
}

export function ListConvosProviderInner({ children }: { children: React.ReactNode }) {
	const messagesBus = useMessagesEventBus();
	const queryClient = useQueryClient();
	const { currentConvoId } = useCurrentConvoId();
	const { currentAccount } = useSession();

	const debouncedRefetch = useMemo(() => {
		const refetchAndInvalidate = () => {
			void queryClient.invalidateQueries({ queryKey: [RQKEY_ROOT] });
		};
		return throttle(refetchAndInvalidate, 500, {
			leading: true,
			trailing: true,
		});
	}, [queryClient]);

	// The unread badge count is derived from chat.bsky.convo.getUnreadCounts.
	// Any chat log can change it, so refresh it (throttled) on every batch.
	const debouncedInvalidateUnreadCounts = useMemo(() => {
		return throttle(
			() => {
				void queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_RQKEY_PARTIAL });
			},
			500,
			{ leading: true, trailing: true },
		);
	}, [queryClient]);

	useEffect(() => {
		const unsub = messagesBus.on(
			(events) => {
				if (events.type !== 'logs') return;

				// Any log batch may change unread state (new message, read, accept,
				// join request, etc.), so refresh the badge count for all of them.
				debouncedInvalidateUnreadCounts();

				function mutateMembers(
					convoId: string,
					fn: (members: ChatBskyActorDefs.ProfileViewBasic[]) => ChatBskyActorDefs.ProfileViewBasic[],
				) {
					queryClient.setQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(
						listConvoMembersQueryKey(convoId),
						(old) => {
							if (!old) return; // query doesn't exist yet, skip
							return fn(old);
						},
					);
				}

				function mutateConvoView(
					convoId: string,
					fn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
				) {
					queryClient.setQueryData<ChatBskyConvoDefs.ConvoView>(CONVO_KEY(convoId), (old) =>
						old ? fn(old) : old,
					);
					queryClient.setQueriesData<ConvoListQueryData>({ queryKey: [RQKEY_ROOT] }, (old) =>
						optimisticUpdate(convoId, old, fn),
					);
				}

				function handleMemberAdded(
					convoId: string,
					did: string,
					relatedProfiles: ChatBskyActorDefs.ProfileViewBasic[],
					rev: string,
				) {
					const newMember = relatedProfiles.find((r) => r.did === did);
					if (!newMember) return;
					// if the optimistic add already added them, skip the memberCount bump to avoid double-counting
					const alreadyKnownMember =
						queryClient
							.getQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(listConvoMembersQueryKey(convoId))
							?.some((m) => m.did === did) ?? false;
					mutateMembers(convoId, (list) => (list.some((m) => m.did === did) ? list : list.concat(newMember)));
					mutateConvoView(
						convoId,
						withRevGuard(rev, (convo) => addMemberToConvoView(convo, newMember, rev, alreadyKnownMember)),
					);
				}

				function handleMemberRemoved(convoId: string, did: string, rev: string) {
					// if the optimistic remove already dropped them, skip the memberCount decrement to avoid double-counting
					const alreadyRemovedMember =
						queryClient
							.getQueryData<ChatBskyActorDefs.ProfileViewBasic[]>(listConvoMembersQueryKey(convoId))
							?.some((m) => m.did === did) === false;
					mutateMembers(convoId, (list) => list.filter((m) => m.did !== did));
					mutateConvoView(
						convoId,
						withRevGuard(rev, (convo) => removeMemberFromConvoView(convo, did, rev, alreadyRemovedMember)),
					);
				}

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
							// The viewer is no longer in this convo (they left on another device, or were
							// removed — removed members receive a logLeaveConvo, not a logRemoveMember). Refetch
							// any cached join link preview so its viewer state reflects the lost membership.
							void invalidateJoinLinkPreviewsForConvo(queryClient, log.convoId);
							break;
						}
						case 'chat.bsky.convo.defs#logDeleteMessage': {
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(
									log.convoId,
									old,
									withRevGuard(log.rev, (convo) => {
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
								),
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
								// Convo not found, trigger refetch. Use continue (not return) so
								// the remaining logs in this batch still apply - the bus advances
								// its cursor past this batch, so a dropped log is never
								// redelivered.
								debouncedRefetch();
								continue;
							}

							// Drop stale out-of-order events whose rev isn't newer than what we already have.
							if (logRef.rev <= foundConvo.rev) break;

							const messageIsMessageOrDeleted =
								logRef.message.$type === 'chat.bsky.convo.defs#messageView' ||
								logRef.message.$type === 'chat.bsky.convo.defs#deletedMessageView';

							// add relatedProfiles to members list, but making sure to dedupe
							const relatedProfilesSansMembers = (logRef.relatedProfiles ?? []).filter(
								(profile) => !foundConvo.members.some((member) => member.did === profile.did),
							);

							// Update the convo
							const updatedConvo = {
								...foundConvo,
								members: [...foundConvo.members, ...relatedProfilesSansMembers],
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
							// always update the unread ones, where the convo qualifies
							queryClient.setQueriesData(
								{
									queryKey: RQKEY_PARTIAL('all', 'unread'),
									predicate: convoListQueryPredicate(updatedConvo),
								},
								(old?: ConvoListQueryData) =>
									old
										? updateFn(old)
										: ({
												pageParams: [undefined],
												pages: [{ convos: [updatedConvo], cursor: undefined }],
											} satisfies ConvoListQueryData),
							);
							// update the other ones based on status of the incoming message
							if (updatedConvo.status === 'accepted') {
								queryClient.setQueriesData(
									{
										queryKey: RQKEY_PARTIAL('accepted'),
										predicate: convoListQueryPredicate(updatedConvo),
									},
									updateFn,
								);
							} else if (updatedConvo.status === 'request') {
								queryClient.setQueriesData(
									{
										queryKey: RQKEY_PARTIAL('request'),
										predicate: convoListQueryPredicate(updatedConvo),
									},
									updateFn,
								);
							}
							break;
						}
						case 'chat.bsky.convo.defs#logReadMessage': {
							const logRef: ChatBskyConvoDefs.LogReadMessage = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(
									logRef.convoId,
									old,
									withRevGuard(logRef.rev, (convo) => ({
										...convo,
										unreadCount: 0,
										rev: logRef.rev,
									})),
								),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logReadConvo': {
							const logRef: ChatBskyConvoDefs.LogReadConvo = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(
									logRef.convoId,
									old,
									withRevGuard(logRef.rev, (convo) => ({
										...convo,
										unreadCount: 0,
										rev: logRef.rev,
									})),
								),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logAcceptConvo': {
							const logRef: ChatBskyConvoDefs.LogAcceptConvo = log;
							const requestQueries = queryClient.getQueriesData<ConvoListQueryData>({
								queryKey: RQKEY_PARTIAL('request'),
							});
							let foundConvo: ConvoListItem | null = null;
							for (const [, data] of requestQueries) {
								if (!data) continue;
								foundConvo = getConvoFromQueryData(logRef.convoId, data);
								if (foundConvo) break;
							}
							if (!foundConvo) {
								// Convo not found, trigger refetch. Use continue (not return) so
								// the remaining logs in this batch still apply - the bus advances
								// its cursor past this batch, so a dropped log is never
								// redelivered.
								debouncedRefetch();
								continue;
							}
							// Drop stale out-of-order accepts whose rev isn't newer than what we already have.
							if (logRef.rev <= foundConvo.rev) continue;
							const acceptedConvo: ConvoListItem = {
								...foundConvo,
								status: 'accepted',
								rev: logRef.rev,
							};
							queryClient.setQueriesData({ queryKey: RQKEY_PARTIAL('request') }, (old?: ConvoListQueryData) =>
								optimisticDelete(logRef.convoId, old),
							);
							queryClient.setQueriesData(
								{
									queryKey: RQKEY_PARTIAL('accepted'),
									predicate: convoListQueryPredicate(acceptedConvo),
								},
								(old?: ConvoListQueryData) => {
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
													convos: [acceptedConvo, ...page.convos.filter((c) => c.id !== logRef.convoId)],
												};
											}
											return {
												...page,
												convos: page.convos.filter((c) => c.id !== logRef.convoId),
											};
										}),
									};
								},
							);
							break;
						}
						case 'chat.bsky.convo.defs#logMuteConvo': {
							const logRef: ChatBskyConvoDefs.LogMuteConvo = log;
							mutateConvoView(
								logRef.convoId,
								withRevGuard(logRef.rev, (convo) => ({
									...convo,
									muted: true,
									rev: logRef.rev,
								})),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logUnmuteConvo': {
							const logRef: ChatBskyConvoDefs.LogUnmuteConvo = log;
							mutateConvoView(
								logRef.convoId,
								withRevGuard(logRef.rev, (convo) => ({
									...convo,
									muted: false,
									rev: logRef.rev,
								})),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logLockConvo': {
							const logRef: ChatBskyConvoDefs.LogLockConvo = log;
							mutateConvoView(
								logRef.convoId,
								withRevGuard(logRef.rev, (convo) =>
									convo.kind?.$type === 'chat.bsky.convo.defs#groupConvo'
										? {
												...convo,
												kind: { ...convo.kind, lockStatus: 'locked' },
												rev: logRef.rev,
											}
										: { ...convo, rev: logRef.rev },
								),
							);
							// the log event doesn't say whether the lock is forced by a
							// moderation override, so refetch to pick up the flag.
							void queryClient.invalidateQueries({ queryKey: CONVO_KEY(logRef.convoId) });
							break;
						}
						case 'chat.bsky.convo.defs#logUnlockConvo': {
							const logRef: ChatBskyConvoDefs.LogUnlockConvo = log;
							mutateConvoView(
								logRef.convoId,
								withRevGuard(logRef.rev, (convo) =>
									convo.kind?.$type === 'chat.bsky.convo.defs#groupConvo'
										? {
												...convo,
												kind: {
													...convo.kind,
													lockStatus: 'unlocked',
													// an unlocked convo cannot be moderation-locked.
													lockStatusModerationOverride: false,
												},
												rev: logRef.rev,
											}
										: { ...convo, rev: logRef.rev },
								),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logLockConvoPermanently': {
							const logRef: ChatBskyConvoDefs.LogLockConvoPermanently = log;
							mutateConvoView(
								logRef.convoId,
								withRevGuard(logRef.rev, (convo) =>
									convo.kind?.$type === 'chat.bsky.convo.defs#groupConvo'
										? {
												...convo,
												kind: { ...convo.kind, lockStatus: 'locked-permanently' },
												rev: logRef.rev,
											}
										: { ...convo, rev: logRef.rev },
								),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logEditGroup': {
							// group details changed but aren't included in the log event, refetch to get them
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logCreateJoinLink':
						case 'chat.bsky.convo.defs#logEditJoinLink':
						case 'chat.bsky.convo.defs#logEnableJoinLink':
						case 'chat.bsky.convo.defs#logDisableJoinLink': {
							// join link data is not included in the log event, refetch to get it
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logApproveJoinRequest':
						case 'chat.bsky.convo.defs#logRejectJoinRequest':
						case 'chat.bsky.convo.defs#logWithdrawIncomingJoinRequest': {
							// Route through mutateConvoView (not just the list caches) so the single-convo
							// cache updates too, keeping the in-convo join-requests banner in sync.
							mutateConvoView(
								log.convoId,
								withRevGuard(log.rev, (convo) => applyJoinRequestCountDelta(convo, -1, log.rev)),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logIncomingJoinRequest': {
							mutateConvoView(
								log.convoId,
								withRevGuard(log.rev, (convo) => applyJoinRequestCountDelta(convo, 1, log.rev)),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logReadJoinRequests': {
							mutateConvoView(
								log.convoId,
								withRevGuard(log.rev, (convo) => zeroUnreadJoinRequestCount(convo, log.rev)),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logOutgoingJoinRequest': {
							// viewer isn't in the chat yet, no need to do anything
							break;
						}
						case 'chat.bsky.convo.defs#logWithdrawOutgoingJoinRequest': {
							// the viewer rescinded their own outgoing join request (possibly on another
							// device); drop it from the requests inbox cache
							queryClient.setQueriesData<ConvoRequestListQueryData>(
								{ queryKey: [REQUESTS_RQKEY_ROOT] },
								(old) => optimisticDeleteJoinRequest(log.convoId, old),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logAddReaction': {
							const logRef: ChatBskyConvoDefs.LogAddReaction = log;
							if (logRef.message.$type !== 'chat.bsky.convo.defs#messageView') break;
							const message = logRef.message;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(
									logRef.convoId,
									old,
									withRevGuard(logRef.rev, (convo) => {
										// add relatedProfiles to members list, but making sure to dedupe
										const relatedProfilesSansMembers = (logRef.relatedProfiles ?? []).filter(
											(profile) => !convo.members.some((member) => member.did === profile.did),
										);
										return {
											...convo,
											members: [...convo.members, ...relatedProfilesSansMembers],
											lastReaction: {
												$type: 'chat.bsky.convo.defs#messageAndReactionView',
												reaction: logRef.reaction,
												message,
											},
											rev: logRef.rev,
										};
									}),
								),
							);
							break;
						}
						case 'chat.bsky.convo.defs#logAddMember': {
							const data = log.message.data;
							if (data.$type === 'chat.bsky.convo.defs#systemMessageDataAddMember') {
								handleMemberAdded(log.convoId, data.member.did, log.relatedProfiles, log.rev);
							}
							// refetch so the server can refresh the curated members list
							void queryClient.invalidateQueries({ queryKey: CONVO_KEY(log.convoId) });
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logRemoveMember': {
							const data = log.message.data;
							if (data.$type === 'chat.bsky.convo.defs#systemMessageDataRemoveMember') {
								handleMemberRemoved(log.convoId, data.member.did, log.rev);
							}
							// refetch so the server can refill the curated members list
							void queryClient.invalidateQueries({ queryKey: CONVO_KEY(log.convoId) });
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logMemberJoin': {
							const data = log.message.data;
							if (data.$type === 'chat.bsky.convo.defs#systemMessageDataMemberJoin') {
								handleMemberAdded(log.convoId, data.member.did, log.relatedProfiles, log.rev);
							}
							void queryClient.invalidateQueries({ queryKey: CONVO_KEY(log.convoId) });
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logMemberLeave': {
							const data = log.message.data;
							if (data.$type === 'chat.bsky.convo.defs#systemMessageDataMemberLeave') {
								handleMemberRemoved(log.convoId, data.member.did, log.rev);
							}
							void queryClient.invalidateQueries({ queryKey: CONVO_KEY(log.convoId) });
							debouncedRefetch();
							break;
						}
						case 'chat.bsky.convo.defs#logRemoveReaction': {
							const logRef: ChatBskyConvoDefs.LogRemoveReaction = log;
							queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) =>
								optimisticUpdate(
									logRef.convoId,
									old,
									withRevGuard(logRef.rev, (convo) => {
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
								),
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
	}, [
		messagesBus,
		currentConvoId,
		queryClient,
		currentAccount?.did,
		debouncedRefetch,
		debouncedInvalidateUnreadCounts,
	]);

	return <>{children}</>;
}

export function useUnreadMessageCount(): {
	count: number;
	numUnread?: string;
	hasNew: boolean;
} {
	const { data } = useUnreadCountsQuery();
	const accepted = data?.unreadAcceptedConvos ?? 0;
	const request = data?.unreadRequestConvos ?? 0;

	if (accepted > 0) {
		return {
			count: accepted,
			// accepted is sentinel-capped at UNREAD_ACCEPTED_CAP (meaning "more than
			// cap - 1"). show the "+" overflow label only when accepted is actually
			// capped, otherwise clamp the number to cap - 1 so we never surface the
			// sentinel value (100) itself
			numUnread:
				accepted >= UNREAD_ACCEPTED_CAP
					? String(UNREAD_ACCEPTED_CAP - 1) + '+'
					: String(Math.min(accepted, UNREAD_ACCEPTED_CAP - 1)),
			// only needed when numUnread is undefined
			hasNew: false,
		};
	} else if (request > 0) {
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
}

export type ConvoListQueryData = {
	pageParams: Array<string | undefined>;
	pages: Array<ChatBskyConvoListConvos.$output>;
};

export function useOnMarkAsRead() {
	const queryClient = useQueryClient();

	return (chatId: string) => {
		queryClient.setQueriesData({ queryKey: [RQKEY_ROOT] }, (old?: ConvoListQueryData) => {
			if (!old) return old;
			return optimisticUpdate(chatId, old, (convo) => ({
				...convo,
				unreadCount: 0,
			}));
		});
	};
}

/**
 * Wraps a convo-view update so it's skipped when the incoming event's `rev` is not newer than the convo's
 * current `rev`. Firehose events can arrive out of order (e.g. a retried poll replays an older event after a
 * newer one already landed); applying a stale event would clobber newer state.
 */
function withRevGuard(
	rev: string,
	fn: (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView,
): (convo: ChatBskyConvoDefs.ConvoView) => ChatBskyConvoDefs.ConvoView {
	return (convo) => (rev <= convo.rev ? convo : fn(convo));
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

function applyJoinRequestCountDelta(
	convo: ChatBskyConvoDefs.ConvoView,
	delta: 1 | -1,
	rev: string,
): ChatBskyConvoDefs.ConvoView {
	// join requests are only meaningful for group convos
	if (convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
		return { ...convo, rev };
	}
	// an incoming request is unread, and resolving one (approve/reject/withdraw) clears an
	// unread, so the total and unread counts move together.
	const bump = (n: number | undefined) => {
		const next = Math.max(0, (n ?? 0) + delta);
		return next === 0 ? undefined : next;
	};
	return {
		...convo,
		kind: {
			...convo.kind,
			joinRequestCount: bump(convo.kind.joinRequestCount),
			unreadJoinRequestCount: bump(convo.kind.unreadJoinRequestCount),
		},
		rev,
	};
}

function zeroUnreadJoinRequestCount(
	convo: ChatBskyConvoDefs.ConvoView,
	rev: string,
): ChatBskyConvoDefs.ConvoView {
	// unread join-request count is only meaningful for group convos
	if (convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') {
		return { ...convo, rev };
	}
	return {
		...convo,
		kind: {
			...convo.kind,
			unreadJoinRequestCount: 0,
		},
		rev,
	};
}

function removeMemberFromConvoView(
	convo: ChatBskyConvoDefs.ConvoView,
	did: string,
	rev: string,
	alreadyRemovedMember: boolean,
): ChatBskyConvoDefs.ConvoView {
	// member add/remove/join/leave events are only meaningful for group convos
	if (convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') return convo;
	const nextMembers = convo.members.filter((m) => m.did !== did);
	return {
		...convo,
		rev,
		members: nextMembers,
		kind: {
			...convo.kind,
			memberCount: alreadyRemovedMember ? convo.kind.memberCount : Math.max(0, convo.kind.memberCount - 1),
		},
	};
}

function addMemberToConvoView(
	convo: ChatBskyConvoDefs.ConvoView,
	member: ChatBskyActorDefs.ProfileViewBasic,
	rev: string,
	alreadyKnownMember: boolean,
): ChatBskyConvoDefs.ConvoView {
	// member add/remove/join/leave events are only meaningful for group convos
	if (convo.kind?.$type !== 'chat.bsky.convo.defs#groupConvo') return convo;
	const alreadyInCuratedList = convo.members.some((m) => m.did === member.did);
	const nextMembers = alreadyInCuratedList ? convo.members : convo.members.concat(member);
	return {
		...convo,
		rev,
		members: nextMembers,
		kind: {
			...convo.kind,
			memberCount: alreadyKnownMember ? convo.kind.memberCount : convo.kind.memberCount + 1,
		},
	};
}

export function optimisticDelete(chatId: string, old?: ConvoListQueryData) {
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
