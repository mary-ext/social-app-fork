// scaffold: pass-through View / Fragment for the iOS scroll edge-effect surface. inline at both
// callers (src/screens/Messages/Conversation.tsx,
// src/screens/Messages/components/MessagesList.tsx) once Messages drops native-only scroll polish.

import { type ReactNode, useRef } from 'react';

export function ScrollEdgeEffectProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}

export function useScrollEdgeEffectRef<T>() {
	return useRef<T>(null);
}
