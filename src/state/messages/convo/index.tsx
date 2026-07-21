import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

import type { ChatBskyConvoDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { useQueryClient } from '@tanstack/react-query';

import { useConstant } from '#/lib/hooks/use-constant';
import { useIsDocumentVisible } from '#/lib/visibility';

import { Convo } from '#/state/messages/convo/agent';
import type { ConvoParams, ConvoState } from '#/state/messages/convo/types';
import { isConvoActive } from '#/state/messages/convo/util';
import { useMessagesEventBus } from '#/state/messages/events';
import { RQKEY as getConvoKey, useMarkAsReadMutation } from '#/state/queries/messages/conversation';
import { RQKEY_ROOT as ListConvosQueryKeyRoot } from '#/state/queries/messages/list-conversations';
import { RQKEY as createProfileQueryKey } from '#/state/queries/profile';
import { useClients, useSession } from '#/state/session';

import { useFocusEffect } from '#/routes';

export * from '#/state/messages/convo/util';

function membersChanged(
	a: ChatBskyConvoDefs.ConvoView['members'],
	b: ChatBskyConvoDefs.ConvoView['members'],
) {
	if (a.length !== b.length) return true;
	const aDids = new Set(a.map((m) => m.did));
	return b.some((m) => !aDids.has(m.did));
}

const ChatContext = createContext<ConvoState | null>(null);
ChatContext.displayName = 'ChatContext';

export function useConvo() {
	const ctx = useContext(ChatContext);
	if (!ctx) {
		throw new Error('useConvo must be used within a ConvoProvider');
	}
	return ctx;
}

/** use only when the Convo is active (loaded and ready) or suspended/backgrounded (ready for resumption) */
export function useConvoActive() {
	const ctx = useContext(ChatContext);
	if (!ctx) {
		throw new Error('useConvo must be used within a ConvoProvider');
	}
	if (!isConvoActive(ctx)) {
		throw new Error(`useConvoActive must only be rendered when the Convo is ready.`);
	}
	return ctx;
}

export function ConvoProvider({
	children,
	convoId,
}: Pick<ConvoParams, 'convoId'> & { children: React.ReactNode }) {
	const { chat } = useClients();
	const { currentAccount } = useSession();
	if (!chat || !currentAccount) {
		throw new Error('ConvoProvider must be rendered while signed in');
	}
	return (
		<ConvoProviderInner chat={chat} convoId={convoId} currentDid={currentAccount.did}>
			{children}
		</ConvoProviderInner>
	);
}

function ConvoProviderInner({
	children,
	chat,
	convoId,
	currentDid,
}: {
	children: React.ReactNode;
	chat: Client;
	convoId: string;
	currentDid: Did;
}) {
	const queryClient = useQueryClient();
	const events = useMessagesEventBus();
	const convo = useConstant(() => {
		const placeholder = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(getConvoKey(convoId));
		return new Convo({
			convoId,
			chat,
			currentDid,
			events,
			placeholderData: placeholder ? { convo: placeholder } : undefined,
		});
	});
	// oxlint-disable-next-line typescript/unbound-method -- these are bound in the constructor
	const service = useSyncExternalStore(convo.subscribe, convo.getSnapshot);
	const { mutate: markAsRead } = useMarkAsReadMutation();

	const isVisible = useIsDocumentVisible();
	useFocusEffect(
		useCallback(() => {
			if (isVisible) {
				convo.resume();
				markAsRead({ convoId });

				return () => {
					convo.background();
					markAsRead({ convoId });
				};
			}
		}, [isVisible, convo, convoId, markAsRead]),
	);

	useEffect(() => {
		return convo.on((event) => {
			switch (event.type) {
				case 'invalidate-block-state': {
					for (const did of event.accountDids) {
						void queryClient.invalidateQueries({
							queryKey: createProfileQueryKey(did),
						});
					}
					void queryClient.invalidateQueries({
						queryKey: [ListConvosQueryKeyRoot],
					});
				}
			}
		});
	}, [convo, queryClient]);

	useEffect(() => {
		const [root, id] = getConvoKey(convoId);
		return queryClient.getQueryCache().subscribe((event) => {
			// Only react to data updates. Other event types (e.g. `added`) can be
			// emitted synchronously while another component reads this same query
			// during its render (React Query builds the query in `getOptimisticResult`),
			// and committing to the convo store then would set state on this provider
			// mid-render of that component.
			if (event.type !== 'updated') return;
			const queryKey: unknown[] = event.query.queryKey;
			if (queryKey[0] === root && queryKey[1] === id) {
				const data = queryClient.getQueryData<ChatBskyConvoDefs.ConvoView>(getConvoKey(convoId));
				if (data && convo.convo && data.muted !== convo.convo.view.muted) {
					convo.updateMuted(data.muted);
				}
				if (data && data.kind?.$type === 'chat.bsky.convo.defs#groupConvo' && convo.convo?.kind === 'group') {
					if (data.kind.name !== convo.convo.details.name) {
						convo.updateGroupName(data.kind.name);
					}
					if (data.kind.joinLink !== convo.convo.details.joinLink) {
						convo.updateJoinLink(data.kind.joinLink);
					}
					if (
						data.kind.lockStatus !== convo.convo.details.lockStatus ||
						data.kind.lockStatusModerationOverride !== convo.convo.details.lockStatusModerationOverride
					) {
						convo.updateLockStatus(data.kind.lockStatus, data.kind.lockStatusModerationOverride);
					}
				}
				if (
					data &&
					data.kind?.$type === 'chat.bsky.convo.defs#groupConvo' &&
					convo.convo?.kind === 'group' &&
					(membersChanged(data.members, convo.convo.members) ||
						data.kind.memberCount !== convo.convo.details.memberCount)
				) {
					convo.updateGroupMembers(data.members, data.kind.memberCount);
				}
			}
		});
	}, [convo, convoId, queryClient]);

	return <ChatContext.Provider value={service}>{children}</ChatContext.Provider>;
}
