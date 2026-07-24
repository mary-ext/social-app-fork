import { createContext, useContext, useState } from 'react';

import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

type Context = {
	isContentVisible: boolean;
	setIsContentVisible: (show: boolean) => void;
};

const Context = createContext<Context | null>(null);
Context.displayName = 'HiderContext';

/** reads the enclosing {@link Outer}'s state. only valid below one. */
export const useHider = () => {
	const ctx = useContext(Context);
	if (!ctx) {
		throw new Error('useHider must be used within a Hider.Outer');
	}
	return ctx;
};

export function Outer({
	modui,
	isContentVisibleInitialState,
	allowOverride,
	children,
}: React.PropsWithChildren<{
	isContentVisibleInitialState?: boolean;
	allowOverride?: boolean;
	modui: DisplayRestrictions | undefined;
}>) {
	const blur = modui?.blurs[0];
	const [isContentVisible, setIsContentVisible] = useState(isContentVisibleInitialState || !blur);
	const canOverride = allowOverride ?? !modui?.noOverride;

	const onSetContentVisible = (show: boolean) => {
		if (!canOverride) {
			return;
		}
		setIsContentVisible(show);
	};

	const ctx = {
		isContentVisible,
		setIsContentVisible: onSetContentVisible,
	};

	return <Context.Provider value={ctx}>{children}</Context.Provider>;
}

export function Content({ children }: { children: React.ReactNode }) {
	const ctx = useHider();
	return ctx.isContentVisible ? children : null;
}

export function Mask({ children }: { children: React.ReactNode }) {
	const ctx = useHider();
	return ctx.isContentVisible ? null : children;
}
