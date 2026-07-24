import { createContext, useContext } from 'react';

const SplitViewContext = createContext<{
	isWithinSplitView: boolean;
	isWithinLeftPanel: boolean;
}>({
	isWithinSplitView: false,
	isWithinLeftPanel: false,
});

export function SplitViewProvider({ children, side }: { children: React.ReactNode; side: 'left' | 'right' }) {
	const value = {
		isWithinSplitView: true,
		isWithinLeftPanel: side === 'left',
	};
	return <SplitViewContext value={value}>{children}</SplitViewContext>;
}

export const useIsWithinSplitView = () => useContext(SplitViewContext);
