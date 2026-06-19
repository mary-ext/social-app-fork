import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

type SetContext = {
	add: () => void;
	subtract: () => void;
};

const setContext = createContext<SetContext | null>(null);
setContext.displayName = 'MinimalModeSetContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	// defaults to "visible", if the count is >0 it gets hidden
	const countRef = useRef(0);
	const add = useCallback(() => {
		countRef.current += 1;
	}, []);
	const subtract = useCallback(() => {
		// count must never go below 0
		if (countRef.current > 0) countRef.current -= 1;
	}, []);

	const setters = useMemo(
		() => ({
			add,
			subtract,
		}),
		[add, subtract],
	);

	return <setContext.Provider value={setters}>{children}</setContext.Provider>;
}

export function useMinimalShellModeSetters() {
	const context = useContext(setContext);
	if (!context) throw new Error('useMinimalShellModeSetters must be used within a MinimalModeProvider');
	return context;
}

export function useEnableMinimalShellMode({ enabled } = { enabled: true }) {
	const setters = useMinimalShellModeSetters();
	useEffect(() => {
		if (enabled) {
			setters.add();
			return () => setters.subtract();
		}
	}, [enabled, setters]);
}

export function useEnableMinimalShellModeForScreen({ enabled } = { enabled: true }) {
	const setters = useMinimalShellModeSetters();
	useFocusEffect(
		useCallback(() => {
			if (enabled) {
				setters.add();
				return () => setters.subtract();
			}
		}, [enabled, setters]),
	);
}
