import { createContext, type ReactNode, useContext } from 'react';

const MessageContext = createContext(false);
MessageContext.displayName = 'MessageContext';

export function MessageContextProvider({ children }: { children: ReactNode }) {
	return <MessageContext.Provider value={true}>{children}</MessageContext.Provider>;
}

export function useIsWithinMessage() {
	return useContext(MessageContext);
}
