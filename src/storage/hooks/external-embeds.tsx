import { createContext, useContext } from 'react';

import type { EmbedPlayerSource } from '#/lib/strings/embed-player';

import { type Device, device, useStorage } from '#/storage';

type ExternalEmbeds = NonNullable<Device['externalEmbeds']>;
type SetExternalEmbedPref = (source: EmbedPlayerSource, value: 'hide' | 'show' | undefined) => void;

const stateContext = createContext<ExternalEmbeds>({});
const setContext = createContext<SetExternalEmbedPref>(() => {});

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const [state = {}, setState] = useStorage(device, ['externalEmbeds']);

	const setExternalEmbedPref: SetExternalEmbedPref = (source, value) => {
		const next = { ...device.get(['externalEmbeds']), [source]: value };
		setState(next);
	};

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
