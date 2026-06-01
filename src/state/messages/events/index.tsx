import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Client } from '@atcute/client';

import { MessagesEventBus } from '#/state/messages/events/agent';
import { useClients, useSession } from '#/state/session';

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
	const { chat } = useClients();

	if (!currentAccount || !chat) {
		return <MessagesEventBusContext.Provider value={null}>{children}</MessagesEventBusContext.Provider>;
	}

	return <MessagesEventBusProviderInner chat={chat}>{children}</MessagesEventBusProviderInner>;
}

function MessagesEventBusProviderInner({ chat, children }: { chat: Client; children: React.ReactNode }) {
	const [bus] = useState(() => new MessagesEventBus({ chat }));

	useEffect(() => {
		bus.resume();

		return () => {
			bus.suspend();
		};
	}, [bus]);

	useEffect(() => {
		const handleAppStateChange = (nextAppState: string) => {
			if (nextAppState === 'active') {
				bus.resume();
			} else {
				bus.background();
			}
		};

		const sub = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			sub.remove();
		};
	}, [bus]);

	return <MessagesEventBusContext.Provider value={bus}>{children}</MessagesEventBusContext.Provider>;
}
