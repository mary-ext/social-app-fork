import { createContext, useContext, useEffect } from 'react';

import type { Client } from '@atcute/client';

import { useConstant } from '#/lib/hooks/use-constant';
import { onVisibilityChange } from '#/lib/visibility';

import { MessagesEventBus } from '#/state/messages/events/agent';
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

export function MessagesEventBusProvider({ children }: { children: React.ReactNode }) {
	const { currentAccount } = useSession();
	const { chat } = getClients();

	if (!currentAccount || !chat) {
		return <MessagesEventBusContext.Provider value={null}>{children}</MessagesEventBusContext.Provider>;
	}

	return <MessagesEventBusProviderInner chat={chat}>{children}</MessagesEventBusProviderInner>;
}

function MessagesEventBusProviderInner({ chat, children }: { chat: Client; children: React.ReactNode }) {
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

	return <MessagesEventBusContext.Provider value={bus}>{children}</MessagesEventBusContext.Provider>;
}
