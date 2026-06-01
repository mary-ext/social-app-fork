import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { EmbedPlayerSource } from '#/lib/strings/embed-player';

import { type Device, device } from '#/storage';

type ExternalEmbeds = NonNullable<Device['externalEmbeds']>;
type SetExternalEmbedPref = (source: EmbedPlayerSource, value: 'hide' | 'show' | undefined) => void;

const stateContext = createContext<ExternalEmbeds>({});
const setContext = createContext<SetExternalEmbedPref>(() => {});

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [state, setState] = useState<ExternalEmbeds>(() => device.get(['externalEmbeds']) ?? {});

	useEffect(() => {
		const sub = device.addOnValueChangedListener(['externalEmbeds'], () => {
			setState(device.get(['externalEmbeds']) ?? {});
		});
		return () => sub.remove();
	}, []);

	const setExternalEmbedPref = useCallback<SetExternalEmbedPref>((source, value) => {
		const next = { ...device.get(['externalEmbeds']), [source]: value };
		setState(next);
		device.set(['externalEmbeds'], next);
	}, []);

	return (
		<stateContext.Provider value={state}>
			<setContext.Provider value={setExternalEmbedPref}>{children}</setContext.Provider>
		</stateContext.Provider>
	);
}

export function useExternalEmbedsPrefs() {
	return useContext(stateContext);
}

export function useSetExternalEmbedPref() {
	return useContext(setContext);
}
