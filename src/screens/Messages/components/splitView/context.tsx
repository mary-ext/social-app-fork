import { createContext, useContext } from 'react';

const SplitViewContext = createContext<{
	isWithinSplitView: boolean;
	isWithinLeftPanel: boolean;
	isWithinRightPanel: boolean;
}>({
	isWithinSplitView: false,
	isWithinLeftPanel: false,
	isWithinRightPanel: false,
});

export function SplitViewProvider({ children, side }: { children: React.ReactNode; side: 'left' | 'right' }) {
	const value = {
		isWithinSplitView: true,
		isWithinLeftPanel: side === 'left',
		isWithinRightPanel: side === 'right',
	};
	return <SplitViewContext value={value}>{children}</SplitViewContext>;
}

export const useIsWithinSplitView = () => useContext(SplitViewContext);
