import { createContext, useContext, useMemo } from 'react';

import { type SharedValue, useSharedValue } from '#/lib/animations/reanimatedCompat';

type StateContext = {
	headerHeight: SharedValue<number>;
};

const stateContext = createContext<StateContext>({
	headerHeight: {
		value: 0,
		addListener() {
			return 0;
		},
		removeListener() {},
		modify() {},
		get() {
			return 0;
		},
		set() {},
	},
});
stateContext.displayName = 'ShellLayoutContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const headerHeight = useSharedValue(0);

	const value = useMemo(
		() => ({
			headerHeight,
		}),
		[headerHeight],
	);

	return <stateContext.Provider value={value}>{children}</stateContext.Provider>;
}

export function useShellLayout() {
	return useContext(stateContext);
}
