import { createContext, useMemo } from 'react';

import { type SharedValue } from '#/lib/animations/reanimatedCompat';

export const PagerHeaderContext = createContext<{
	scrollY: SharedValue<number>;
	headerHeight: number;
} | null>(null);
PagerHeaderContext.displayName = 'PagerHeaderContext';

/**
 * Passes information about the scroll position and header height down via context for the pager header to
 * consume.
 *
 * @platform ios, android
 */
export function PagerHeaderProvider({
	scrollY,
	headerHeight,
	children,
}: {
	scrollY: SharedValue<number>;
	headerHeight: number;
	children: React.ReactNode;
}) {
	const value = useMemo(() => ({ scrollY, headerHeight }), [scrollY, headerHeight]);
	return <PagerHeaderContext.Provider value={value}>{children}</PagerHeaderContext.Provider>;
}

export function usePagerHeaderContext(): React.ContextType<typeof PagerHeaderContext> {
	return null;
}
