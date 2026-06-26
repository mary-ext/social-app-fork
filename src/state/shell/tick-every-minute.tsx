import { createContext, useContext, useEffect, useState } from 'react';

type StateContext = number;

const stateContext = createContext<StateContext>(0);
stateContext.displayName = 'TickEveryMinuteContext';

export function Provider({ children }: React.PropsWithChildren<{}>) {
	// lazy init: Date.now() is impure, so evaluate once at mount rather than on every render.
	const [tick, setTick] = useState(() => Date.now());
	useEffect(() => {
		const i = setInterval(() => {
			setTick(Date.now());
		}, 60_000);
		return () => clearInterval(i);
	}, []);
	return <stateContext.Provider value={tick}>{children}</stateContext.Provider>;
}

export function useTickEveryMinute() {
	return useContext(stateContext);
}
