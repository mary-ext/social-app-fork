import { createContext, useCallback, useContext, useState } from 'react';

type StateContext = Map<string, boolean>;
type SetStateContext = (uri: string, value: boolean) => void;

const stateContext = createContext<StateContext>(new Map());
stateContext.displayName = 'ThreadMutesStateContext';
const setStateContext = createContext<SetStateContext>((_: string) => false);
setStateContext.displayName = 'ThreadMutesSetStateContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [state, setState] = useState<StateContext>(() => new Map());

	const setThreadMute = useCallback(
		(uri: string, value: boolean) => {
			setState((prev) => {
				const next = new Map(prev);
				next.set(uri, value);
				return next;
			});
		},
		[setState],
	);

	return (
		<stateContext.Provider value={state}>
			<setStateContext.Provider value={setThreadMute}>{children}</setStateContext.Provider>
		</stateContext.Provider>
	);
}

export function useIsThreadMuted(uri: string, defaultValue = false) {
	const state = useContext(stateContext);
	return state.get(uri) ?? defaultValue;
}

export function useSetThreadMute() {
	return useContext(setStateContext);
}
