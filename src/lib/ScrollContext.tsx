import { createContext, useContext } from 'react';
import type { NativeScrollEvent } from 'react-native';

export type ScrollEvent = NativeScrollEvent & {
	eventName?: string;
	zoomScale?: number;
};

export type ScrollHandlers<Context extends Record<string, unknown> = Record<string, unknown>> = {
	onBeginDrag?: (event: ScrollEvent, context: Context) => void;
	onEndDrag?: (event: ScrollEvent, context: Context) => void;
	onMomentumEnd?: (event: ScrollEvent, context: Context) => void;
	onScroll?: (event: ScrollEvent, context: Context) => void;
};

const ScrollContext = createContext<ScrollHandlers>({
	onBeginDrag: undefined,
	onEndDrag: undefined,
	onScroll: undefined,
	onMomentumEnd: undefined,
});
ScrollContext.displayName = 'ScrollContext';

export function useScrollHandlers(): ScrollHandlers {
	return useContext(ScrollContext);
}

type ProviderProps = { children: React.ReactNode } & ScrollHandlers;

// Note: this completely *overrides* the parent handlers.
// It's up to you to compose them with the parent ones via useScrollHandlers() if needed.
export function ScrollProvider({ children, onBeginDrag, onEndDrag, onScroll, onMomentumEnd }: ProviderProps) {
	const handlers = {
		onBeginDrag,
		onEndDrag,
		onScroll,
		onMomentumEnd,
	};
	return <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>;
}
