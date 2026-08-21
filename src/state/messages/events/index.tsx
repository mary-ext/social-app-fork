import { createContext, type ReactNode, useContext, useEffect } from 'react';

import type { Client } from '@atcute/client';

import { useQueryClient } from '@tanstack/react-query';

import { onVisibilityChange } from '#/lib/browser/visibility';
import { useConstant } from '#/lib/hooks/use-constant';
import { useThrottledCallback } from '#/lib/hooks/use-debounce';

import { MessagesEventBus } from '#/state/messages/events/agent';
import { RQKEY_PARTIAL as UNREAD_COUNTS_RQKEY_PARTIAL } from '#/state/queries/messages/get-unread-counts';
import { getClients, useSession } from '#/state/session';

const MessagesEventBusContext = createContext<MessagesEventBus | null>(null);
MessagesEventBusContext.displayName = 'MessagesEventBusContext';

export function useMessagesEventBus() {
	const ctx = useContext(MessagesEventBusContext);
	if (!ctx) {
		throw new Error('useMessagesEventBus must be used within a MessagesEventBusProvider');
	}
	return ctx;
}

export function MessagesEventBusProvider({ children }: { children: ReactNode }) {
	const { currentAccount } = useSession();
	const { chat } = getClients();

	if (!currentAccount || !chat) {
		return <MessagesEventBusContext.Provider value={null}>{children}</MessagesEventBusContext.Provider>;
	}

	return <MessagesEventBusProviderInner chat={chat}>{children}</MessagesEventBusProviderInner>;
}

function MessagesEventBusProviderInner({ chat, children }: { chat: Client; children: ReactNode }) {
	const bus = useConstant(() => new MessagesEventBus({ chat }));

	useEffect(() => {
		bus.resume();

		return () => {
			bus.suspend();
		};
	}, [bus]);

	useEffect(() => {
		return onVisibilityChange((visible) => {
			if (visible) {
				bus.resume();
			} else {
				bus.background();
			}
		});
	}, [bus]);

	return (
		<MessagesEventBusContext.Provider value={bus}>
			<UnreadCountsSync bus={bus} />
			{children}
		</MessagesEventBusContext.Provider>
	);
}

function UnreadCountsSync({ bus }: { bus: MessagesEventBus }) {
	const queryClient = useQueryClient();
	const invalidateUnreadCounts = useThrottledCallback(() => {
		void queryClient.invalidateQueries({ queryKey: UNREAD_COUNTS_RQKEY_PARTIAL });
	}, 500);

	useEffect(() => {
		return bus.on((event) => {
			if (event.type === 'logs') {
				invalidateUnreadCounts();
			}
		}, {});
	}, [bus, invalidateUnreadCounts]);

	return null;
}
